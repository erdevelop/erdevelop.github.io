/* erdevelop · cihazlar arası senkron
   Bu tarayıcıdaki site verilerini (dil kulübü ilerlemesi, Konsol dosyaları, oyun rekorları, araç ayarları…)
   hesabın Firestore belgesine (users/{uid}.senkron) yazar ve diğer cihazlardaki değişiklikleri geri getirir.
   Kullanım: await erSenkron.calistir(db, uid)  → { gonderilen, alinan, birlesen, atlanan, boyut }
   Otomatik senkron: localStorage 'erdevelop-sync' = '1' iken js/site.js her sayfada (en çok 5 dakikada bir) çalıştırır. */
(function () {
  'use strict';
  if (window.erSenkron) return;
  const META = 'erdevelop-sync-meta', SON = 'erdevelop-sync-son', MAX_TEK = 150 * 1024, MAX_TOP = 700 * 1024;
  /* senkron dışında kalanlar: cihaza özgü, gizli ya da geçici kayıtlar */
  const HARIC = /^(erdevelop-key|skipgc|erdevelop-mode(-gun)?|erdevelop-sync.*|firebase.*|.*import.*|.*token.*|.*cache.*|mini-gh-clip|erdevelop-pops|goatcounter.*|erdevelop-z(id|k|ot)|erdevelop-ist.*|kucuk-krallik.*|krallik-kartlari-mac)$/i;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const js = (k, d) => { try { return JSON.parse(LS.get(k)) ?? d; } catch (e) { return d; } };
  const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + '.' + s.length; };
  function anahtarlar() {
    const o = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && !HARIC.test(k)) o.push(k); } } catch (e) { }
    return o.sort();
  }
  /* aynı anahtar iki cihazda da değiştiyse: nesneler birleştirilir (sayılarda büyüğü, dizilerde birleşim, metinde bu cihaz) */
  function birlestir(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) { const s = new Set(a.map(x => JSON.stringify(x))); return a.concat(b.filter(x => !s.has(JSON.stringify(x)))); }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const o = { ...b }; for (const k of Object.keys(a)) o[k] = k in b ? birlestir(a[k], b[k]) : a[k]; return o; }
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    return a === undefined ? b : a;
  }
  function birlestirMetin(yerel, uzak) {
    try { const a = JSON.parse(yerel), b = JSON.parse(uzak); if (a && b && typeof a === 'object' && typeof b === 'object') return JSON.stringify(birlestir(a, b)); } catch (e) { }
    return yerel;
  }
  function kategori(k) {
    if (/^erdevelop-(eng|fra|deu)$/.test(k)) return 'Dil kulüpleri';
    if (/^ak:konsol:fs$/.test(k)) return 'Konsol dosyaları';
    if (/rekor|best|ob_data/.test(k)) return 'Oyun rekorları';
    if (/^ak:konsol/.test(k)) return 'Konsol ayarları';
    if (/egitim/.test(k)) return 'Eğitimler';
    return 'Araç ayarları';
  }
  function ozet() {
    const g = {}; let top = 0, buyuk = 0;
    for (const k of anahtarlar()) { const v = LS.get(k) || '', n = v.length + k.length; if (v.length > MAX_TEK) { buyuk++; continue; } const c = kategori(k); g[c] = (g[c] || 0) + 1; top += n; }
    return { gruplar: g, boyut: top, buyuk, son: +LS.get(SON) || 0 };
  }
  const now36 = () => Date.now().toString(36);
  let calisiyor = null;
  async function calistir(db, uid, opt = {}) {
    if (calisiyor) return calisiyor;
    calisiyor = (async () => {
      const ref = db.collection('users').doc(uid);
      const snap = await ref.get(); const S = (snap.exists && snap.data().senkron) || {}, R = S.v || {};
      /* bulut kopyasının kimliği: bulut silinip yeniden kurulduysa eski kayıtlara göre silme yapılmaz */
      const yeniId = !S.id, id = S.id || Math.random().toString(36).slice(2, 10) + now36();
      const m0 = js(META, {}), meta = m0 && m0.id === id ? (m0.k || {}) : {}, now = Date.now(), FV = firebase.firestore.FieldValue;
      const yama = {}, sonuc = { gonderilen: 0, alinan: 0, birlesen: 0, silinen: 0, atlanan: [] };
      const tum = new Set([...anahtarlar(), ...Object.keys(R), ...Object.keys(meta)]);
      let toplam = Object.values(R).reduce((t, x) => t + ((x && x.d) || '').length, 0);
      const yeniMeta = { ...meta };
      for (const k of tum) {
        if (HARIC.test(k)) continue;
        const L = LS.get(k), U = R[k] && typeof R[k].d === 'string' ? R[k] : null, M = meta[k];
        const lh = L == null ? null : hash(L);
        const yDeg = M ? lh !== M.h : L != null, uDeg = M ? (U ? U.t !== M.t : M.t != null) : !!U;
        if (!yDeg && !uDeg) continue;
        const gonder = v => { if (v.length > MAX_TEK || toplam - ((U && U.d) || '').length + v.length > MAX_TOP) { sonuc.atlanan.push(k); return false; }
          toplam += v.length - ((U && U.d) || '').length; yama[k] = { d: v, t: now, h: hash(v) }; yeniMeta[k] = { h: hash(v), t: now }; return true; };
        if (yDeg && !uDeg) {
          if (L == null) { if (U) { yama[k] = FV.delete(); toplam -= U.d.length; sonuc.silinen++; } delete yeniMeta[k]; }
          else if (gonder(L)) sonuc.gonderilen++;
        } else if (!yDeg && uDeg) {
          if (U) { LS.set(k, U.d); yeniMeta[k] = { h: hash(U.d), t: U.t }; sonuc.alinan++; }
          else { LS.del(k); delete yeniMeta[k]; sonuc.silinen++; }
        } else {
          if (L == null && !U) { delete yeniMeta[k]; continue; }
          if (L == null) { LS.set(k, U.d); yeniMeta[k] = { h: hash(U.d), t: U.t }; sonuc.alinan++; continue; }
          if (!U) { if (gonder(L)) sonuc.gonderilen++; continue; }
          /* ilk senkronda (bu cihazda kayıt yok) uzaktaki öncelikli; sonrasında bu cihaz */
          const v = M ? birlestirMetin(L, U.d) : birlestirMetin(U.d, L);
          if (v === U.d) { LS.set(k, v); yeniMeta[k] = { h: hash(v), t: U.t }; sonuc.alinan++; }
          else { LS.set(k, v); if (gonder(v)) sonuc.birlesen++; }
        }
      }
      if (Object.keys(yama).length || yeniId) await ref.set({ senkron: { id, v: yama, t: now } }, { merge: true });
      LS.set(META, JSON.stringify({ id, k: yeniMeta })); LS.set(SON, String(now));
      sonuc.boyut = toplam; sonuc.uzakAnahtar = Object.keys(R).length;
      if (sonuc.alinan) try { dispatchEvent(new CustomEvent('er-senkron', { detail: sonuc })); } catch (e) { }
      return sonuc;
    })();
    try { return await calisiyor; } finally { calisiyor = null; }
  }
  /* hesap silinirken ya da senkron kapatılırken: bulut kopyasını sil */
  async function bulutuSil(db, uid) { await db.collection('users').doc(uid).set({ senkron: firebase.firestore.FieldValue.delete() }, { merge: true }); LS.del(META); LS.del(SON); }
  window.erSenkron = { calistir, bulutuSil, anahtarlar, ozet, kategori, HARIC, _birlestir: birlestir };
})();
