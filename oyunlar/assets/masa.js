/* Masa — sıra tabanlı oyunlar için çevrimiçi oda katmanı (Tavla, Okey).
   Firebase Realtime Database (mesaj1 projesi, anonim oturum; kurallar firebase-kurallari-oyunlar.json → "masa").
   Yol: masa/<oyun>/oda/<kod> = { h: kuran, t, d: 0 bekliyor | 1 oyunda | 2 bitti, k: koltuk sayısı, a: açık mı,
                                   o: { <uid>: { n: ad, k: koltuk, x: koptuğu an } }, g: { v: sürüm, s: durum (JSON metni) } }
        masa/<oyun>/acik/<kod> = { t, u, n, b: boş koltuk }   (hızlı eşleşme dizini)
   Sunucu yok: durum bütün oyuncularda açık durur (Okey'de eller dahil). Arkadaş arası oyun için yeterli, hileye karşı korumalı değil.
   ?masasahte → gerçek sunucu yerine aynı tarayıcıda sekmeler arası çalışan sahte katman (test). */
(function () {
'use strict';
const CONFIG = { apiKey: 'AIzaSyCQly5YyU9TNMfvZNBVA1UPZuglO8Rzogo', authDomain: 'mesaj1-fc2c5.firebaseapp.com', databaseURL: 'https://mesaj1-fc2c5-default-rtdb.firebaseio.com', projectId: 'mesaj1-fc2c5', appId: '1:835014166916:web:f47e7f8ec1641bc44c75d1' };
const HARF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ADKEY = 'ob-masa-ad';
const yukle = src => { const c = window.__erJs = window.__erJs || {}; return c[src] || (c[src] = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => { delete c[src]; no(new Error('yüklenemedi')); }; document.head.appendChild(sc); })); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let DB = null, UID = null, baglanti = null;

/* gerçek veritabanı bağdaştırıcısı */
async function gercek() {
  for (const n of ['app', 'auth', 'database']) await yukle(`https://www.gstatic.com/firebasejs/10.12.2/firebase-${n}-compat.js`);
  const app = firebase.apps.find(a => a.name === 'masa') || firebase.initializeApp(CONFIG, 'masa');
  const cr = await firebase.auth(app).signInAnonymously(), db = firebase.database(app); let fark = 0;
  db.ref('.info/serverTimeOffset').on('value', sn => { fark = sn.val() || 0; });
  return { uid: cr.user.uid,
    get: p => db.ref(p).once('value').then(s => s.val()),
    set: (p, v) => db.ref(p).set(v), update: (p, v) => db.ref(p).update(v), remove: p => db.ref(p).remove(),
    tx: (p, f) => db.ref(p).transaction(f, null, false).then(r => ({ ok: r.committed, val: r.snapshot.val() })),
    on: (p, cb) => { const r = db.ref(p), h = r.on('value', s => cb(s.val()), () => cb(null, true)); return () => r.off('value', h); },
    kopunca: (p, v) => v === null ? db.ref(p).onDisconnect().remove() : db.ref(p).onDisconnect().update(v), kopuncaIptal: p => db.ref(p).onDisconnect().cancel(),
    acik: p => db.ref(p).orderByChild('t').limitToLast(30).once('value').then(s => s.val() || {}),
    ilk: (p, alan, n) => db.ref(p).orderByChild(alan).limitToLast(n).once('value').then(s => s.val() || {}),
    now: () => Date.now() + fark };
}
function baglan() {
  if (baglanti) return baglanti;
  baglanti = (async () => {
    if (/[?&]masasahte/.test(location.search)) { await yukle('assets/masa-sahte.js'); DB = window.__MASA_SAHTE(); } else DB = await gercek();
    UID = DB.uid; return DB;
  })();
  baglanti.catch(() => { baglanti = null; });
  return baglanti;
}
const adAl = () => { try { return localStorage.getItem(ADKEY) || ''; } catch (e) { return ''; } };
const adKoy = a => { a = String(a || '').replace(/\s+/g, ' ').trim().slice(0, 14); try { localStorage.setItem(ADKEY, a); } catch (e) { } return a; };
const kodUret = () => Array.from({ length: 5 }, () => HARF[(Math.random() * HARF.length) | 0]).join('');
const yol = (oyun, kod) => 'masa/' + oyun + '/oda/' + kod;

/* oda nesnesi */
function odaAc(oyun, kod) {
  const kok = yol(oyun, kod), dinleyen = new Set(), mesajcilar = new Set(), gorulen = {}; let veri = null, kapat = null, nabiz = 0, ayrildi = false, ilkVeri = true;
  const oda = {
    oyun, kod, get uid() { return UID; }, get veri() { return veri; },
    get ben() { return veri && veri.o && veri.o[UID] ? veri.o[UID].k : -1; },
    /* koltuk dizisi: { uid, n, var } ya da null (boş → bot) */
    koltuklar() { const K = Array.from({ length: (veri && veri.k) || 2 }, () => null); if (veri && veri.o) for (const u in veri.o) { const o = veri.o[u]; if (o && o.k >= 0 && o.k < K.length) K[o.k] = { uid: u, n: o.n || '?', var: !o.x }; } return K; },
    /* botları ve süresi dolan hamleleri yürütecek kişi: bağlı oyunculardan koltuğu en küçük olan */
    yonetici() { const K = oda.koltuklar().filter(x => x && x.var); return !!K.length && K[0].uid === UID; },
    durum() { try { return veri && veri.g && veri.g.s ? JSON.parse(veri.g.s) : null; } catch (e) { return null; } },
    surum() { return (veri && veri.g && veri.g.v) || 0; },
    dinle(f) { dinleyen.add(f); if (veri) f(veri); return () => dinleyen.delete(f); },
    /* durumu yaz: beklenen sürüm değiştiyse yazmaz (başkası önce davranmış) */
    async yaz(s, beklenen) { const b = beklenen == null ? oda.surum() : beklenen, m = JSON.stringify(s); const r = await DB.tx(kok + '/g', c => { const v = (c && c.v) || 0; if (v !== b) return; return { v: v + 1, s: m }; }); return r.ok; },
    async baslat(s) { const m = JSON.stringify(s); const r = await DB.tx(kok + '/g', c => c ? undefined : { v: 1, s: m }); if (r.ok) { await DB.update(kok, { d: 1 }); canli(); } return r.ok; },
    bitir() { return DB.update(kok, { d: 2 }).catch(() => { }); },
    /* hazır ifadeler: masa/<oyun>/oda/<kod>/m/<uid> = { i, t } */
    mesaj(i) { return DB.set(kok + '/m/' + UID, { i, t: DB.now() }).catch(() => { }); },
    mesajDinle(f) { mesajcilar.add(f); return () => mesajcilar.delete(f); },
    yeniden(s) { return DB.update(kok, { d: 1, g: { v: oda.surum() + 1, s: JSON.stringify(s) } }); },
    async ayril() { if (ayrildi) return; ayrildi = true; clearInterval(nabiz); if (kapat) kapat(); dinleyen.clear();
      try { await DB.kopuncaIptal(kok + '/o/' + UID); const bekliyor = veri && veri.d === 0, tek = veri && veri.o && Object.keys(veri.o).filter(u => u !== UID && !veri.o[u].x).length === 0;
        if (tek) { await DB.remove(kok); await DB.remove('masa/' + oyun + '/acik/' + kod); } else if (bekliyor) { await DB.remove(kok + '/o/' + UID); dizin(veri, true); } else await DB.update(kok + '/o/' + UID, { x: DB.now() }); } catch (e) { } },
  };
  /* oynanan masa izleyicilere listelenir: açık dizinde b = 0 */
  function canli() { if (!veri) return; const K = oda.koltuklar().filter(Boolean).map(x => x.n); DB.set('masa/' + oyun + '/acik/' + kod, { t: DB.now(), u: veri.h, n: K.join(', ').slice(0, 16) || '?', b: 0 }).catch(() => { }); }
  function dizin(v, benYok) { if (!v || !v.a || v.d !== 0) return; const n = Object.keys(v.o || {}).filter(u => !(benYok && u === UID)).length; DB.update('masa/' + oyun + '/acik/' + kod, { t: DB.now(), u: v.h, n: (v.o && v.o[v.h] && v.o[v.h].n) || '?', b: Math.max(0, (v.k || 2) - n) }).catch(() => { }); }
  kapat = DB.on(kok, (v, hata) => {
    if (ayrildi) return; veri = v;
    const M = (v && v.m) || {}, simdi = DB.now();
    for (const u in M) { const m = M[u]; if (!m || gorulen[u] === m.t) continue; gorulen[u] = m.t; if (!ilkVeri && simdi - m.t < 15000) mesajcilar.forEach(f => { try { f(u, m.i); } catch (e) { } }); }
    ilkVeri = false; dinleyen.forEach(f => { try { f(v, hata); } catch (e) { console.error(e); } });
  });
  /* kopunca işaretle; geri gelince işareti sil */
  const benYol = kok + '/o/' + UID;
  const hazirla = () => { DB.kopunca(benYol, { x: DB.now() }).catch(() => { }); DB.kopunca('masa/' + oyun + '/acik/' + kod, null).catch(() => { }); };
  hazirla(); nabiz = setInterval(() => { if (veri && veri.o && veri.o[UID] && veri.o[UID].x) { DB.update(benYol, { x: null }).catch(() => { }); hazirla(); } if (veri && veri.d === 0 && oda.yonetici()) dizin(veri); else if (veri && veri.d >= 1 && oda.yonetici()) canli(); }, 12000);
  oda._dizin = () => dizin(veri);
  return oda;
}
function izleAc(oyun, kod) {
  const kok = yol(oyun, kod), dinleyen = new Set(); let veri = null, kapat = null, rozet = null;
  const oda = { oyun, kod, izleyici: true, get uid() { return UID; }, get veri() { return veri; }, get ben() { return -1; },
    koltuklar() { const K = Array.from({ length: (veri && veri.k) || 2 }, () => null); if (veri && veri.o) for (const u in veri.o) { const o = veri.o[u]; if (o && o.k >= 0 && o.k < K.length) K[o.k] = { uid: u, n: o.n || '?', var: !o.x }; } return K; },
    yonetici() { return false; }, durum() { try { return veri && veri.g && veri.g.s ? JSON.parse(veri.g.s) : null; } catch (e) { return null; } },
    surum() { return (veri && veri.g && veri.g.v) || 0; }, dinle(f) { dinleyen.add(f); if (veri) f(veri); return () => dinleyen.delete(f); },
    async yaz() { return false; }, async baslat() { return false; }, bitir() { }, mesaj() { }, mesajDinle() { return () => { }; }, yeniden() { return Promise.resolve(); },
    async ayril() { if (kapat) kapat(); kapat = null; dinleyen.clear(); if (rozet) rozet.remove(); rozet = null; document.body.classList.remove('ms-izliyor'); } };
  kapat = DB.on(kok, v => { veri = v; dinleyen.forEach(f => { try { f(v); } catch (e) { console.error(e); } }); });
  rozet = document.createElement('div'); rozet.className = 'ms-izle-rozet'; rozet.textContent = '👀 İzliyorsun'; document.body.appendChild(rozet); document.body.classList.add('ms-izliyor');
  return oda;
}
async function izle(oyun, kod) { await baglan(); kod = String(kod || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); const v = await DB.get(yol(oyun, kod)); if (!v) throw new Error('Bu kodla bir oda yok.'); if (!v.g) throw new Error('Bu odada oyun henüz başlamadı.'); return izleAc(oyun, kod); }
async function canliListe(oyun) { await baglan(); const L = await DB.acik('masa/' + oyun + '/acik').catch(() => ({})), simdi = DB.now(); return Object.entries(L).filter(([, v]) => v && v.b === 0 && simdi - v.t < 90000).sort((a, b) => b[1].t - a[1].t).slice(0, 12).map(([kod, v]) => ({ kod, n: v.n })); }
async function kur(oyun, koltuk, acik, ad) {
  await baglan(); let kod = '';
  for (let d = 0; d < 6; d++) { kod = kodUret(); const r = await DB.tx(yol(oyun, kod), c => c ? undefined : { h: UID, t: DB.now(), d: 0, k: koltuk, a: acik ? 1 : 0, o: { [UID]: { n: ad, k: 0 } } }); if (r.ok) break; kod = ''; }
  if (!kod) throw new Error('Oda kurulamadı.');
  if (acik) { const r = ELO_OYUN.includes(oyun) ? (await eloAl(oyun).catch(() => ({ r: 1200 }))).r : null; const dz = { t: DB.now(), u: UID, n: ad, b: koltuk - 1 }; await DB.set('masa/' + oyun + '/acik/' + kod, Object.assign({}, dz, r ? { r } : {})).catch(() => DB.set('masa/' + oyun + '/acik/' + kod, dz)).catch(() => { }); }
  return odaAc(oyun, kod);
}
async function katil(oyun, kod, ad) {
  await baglan(); kod = String(kod || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); if (kod.length !== 5) throw new Error('Kod 5 karakter olmalı.');
  const v = await DB.get(yol(oyun, kod)); if (!v) throw new Error('Bu kodla bir oda yok.');
  if (v.o && v.o[UID]) { await DB.update(yol(oyun, kod) + '/o/' + UID, { x: null, n: ad }); return odaAc(oyun, kod); }   /* geri dönüş */
  if (v.d !== 0) throw new Error('Bu odada oyun başlamış.');
  const r = await DB.tx(yol(oyun, kod) + '/o', o => { o = o || {}; if (o[UID]) return o; const dolu = new Set(Object.values(o).map(x => x.k)); let k = -1; for (let i = 0; i < (v.k || 2); i++) if (!dolu.has(i)) { k = i; break; } if (k < 0) return; o[UID] = { n: ad, k }; return o; });
  if (!r.ok) throw new Error('Oda dolu.');
  const oda = odaAc(oyun, kod); setTimeout(() => oda._dizin(), 600); return oda;
}
async function hizli(oyun, koltuk, ad) {
  await baglan(); const L = await DB.acik('masa/' + oyun + '/acik').catch(() => ({})), simdi = DB.now();
  const benR = ELO_OYUN.includes(oyun) ? (await eloAl(oyun).catch(() => ({ r: 1200 }))).r : 0;
  const aday = Object.entries(L).filter(([, v]) => v && v.b > 0 && v.u !== UID && simdi - v.t < 40000).sort((a, b) => benR ? Math.abs((a[1].r || 1200) - benR) - Math.abs((b[1].r || 1200) - benR) || b[1].t - a[1].t : b[1].t - a[1].t);
  for (const [kod] of aday) { try { return await katil(oyun, kod, ad); } catch (e) { } }
  return kur(oyun, koltuk, true, ad);
}

/* ---------- haftalık sıralama ve karşılıklı skor ----------
   masa_sira/<yıl-hafta>/<uid> = { n: ad, g: galibiyet, o: oyun, t }  (yalnız en az iki kişinin oynadığı çevrimiçi oyunlar sayılır)
   Karşılıklı skor bu cihazda tutulur: aynı rakiple (anonim kimliğiyle) tüm zamanlar. */
const ADLAR_OYUN = { tavla: 'Tavla', okey: 'Okey', okey101: '101 Okey', batak: 'Batak', king: 'King', tombala: 'Tombala', mangala: 'Mangala', dokuztas: 'Dokuz Taş', amiral: 'Amiral Battı', kelimemasasi: 'Kelime Masası', pisti: 'Pişti', dama: 'Dama', satranc: 'Satranç' };
function hafta(d) { d = d || new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), g = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - g); const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); return y + '-' + String(w).padStart(2, '0'); }
function haftaAraligi() { const d = new Date(), g = (d.getDay() + 6) % 7, a = new Date(d.getFullYear(), d.getMonth(), d.getDate() - g), b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6), f = x => x.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); return f(a) + ' – ' + f(b); }
const KARSI = 'ob-masa-karsi', SAYILAN = 'ob-masa-sayilan';
const karsiOku = () => { try { return JSON.parse(localStorage.getItem(KARSI) || '{}'); } catch (e) { return {}; } };
function karsi(oyun, uid) { return karsiOku()[oyun + ':' + uid] || null; }
function karsiYazi(oda) {
  if (!oda || oda.izleyici) return ''; const K = oda.koltuklar(); if (K.length !== 2) return ''; const r = K.find(x => x && x.uid !== oda.uid); if (!r) return '';
  const k = karsi(oda.oyun, r.uid); if (!k || !(k.g + k.k + k.b)) return '';
  return `${r.n} ile tüm zamanlar: ${k.g} galibiyet · ${k.k} yenilgi${k.b ? ' · ' + k.b + ' berabere' : ''}`;
}
/* r: 1 galibiyet, 0 yenilgi, 0.5 berabere; anahtar: aynı sonucun iki kez sayılmaması için */
function sonuc(oda, r, anahtar) {
  if (!oda || !DB || oda.izleyici) return; const k = oda.oyun + ':' + oda.kod + ':' + anahtar; let L = [];
  try { L = JSON.parse(sessionStorage.getItem(SAYILAN) || '[]'); } catch (e) { } if (L.includes(k)) return; L.push(k); try { sessionStorage.setItem(SAYILAN, JSON.stringify(L.slice(-200))); } catch (e) { }
  const K = oda.koltuklar(), insan = K.filter(Boolean);
  if (K.length === 2) { const x = K.find(y => y && y.uid !== UID); if (x) { const O = karsiOku(), a = oda.oyun + ':' + x.uid, v = O[a] || { g: 0, k: 0, b: 0 }; v.n = x.n; v.t = Date.now(); if (r === 1) v.g++; else if (r === 0) v.k++; else v.b++; O[a] = v;
    const anah = Object.keys(O); if (anah.length > 300) anah.sort((p, q) => O[p].t - O[q].t).slice(0, anah.length - 300).forEach(z => delete O[z]); try { localStorage.setItem(KARSI, JSON.stringify(O)); } catch (e) { } } }
  sonEkle(K, oda.oyun); try { if (K.some(x => x && x.uid !== UID && arkadasMi(x.uid)) && window.Progress) Progress.olay('arkadas_oyna'); } catch (e) { }
  if (insan.length < 2) return;
  if (K.length === 2 && ELO_OYUN.includes(oda.oyun)) eloGuncelle(oda, r).catch(() => { });
  try { if (window.Progress) { Progress.olay('online_oyna'); if (r === 1) Progress.olay('online_kazan'); } } catch (e) { }
  const ad = (K.find(x => x && x.uid === UID) || {}).n || adAl() || '?';
  const ekle = c => { c = c || {}; const simdi = DB.now(); if (simdi < (c.t || 0) + 10000) return; return { n: ad.slice(0, 16), g: (c.g || 0) + (r === 1 ? 1 : 0), o: (c.o || 0) + 1, t: simdi }; };
  DB.tx('masa_sira/' + hafta() + '/' + UID, ekle).catch(() => { });
  const T = turnuva(); if (T.sayar) { DB.tx('masa_turnuva/' + T.anahtar + '/' + UID, ekle).catch(() => { }); try { window.Progress && Progress.olay('turnuva_oyna'); } catch (e) { } }
}
/* ---------- Cumartesi turnuvası ----------
   Her cumartesi 20.00–23.00 (Türkiye saati, UTC+3). Bu saatlerde biten, en az iki kişinin oynadığı çevrimiçi masa oyunları
   masa_turnuva/<yıl-ay-gün>/<uid> = { n, g, o, t } altına da yazılır (23.00'ten sonraki 10 dakika, süren oyunlar bitsin diye sayılır). */
const TSI = 3 * 36e5, T_BAS = 20, T_SON = 23, T_PAY = 10 * 6e4, GUN = 864e5;
const p2 = n => String(n).padStart(2, '0'), tsiGun = x => { const d = new Date(x + TSI); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); };
function turnuva(now) {
  now = now == null ? (DB ? DB.now() : Date.now()) : now;
  const t = new Date(now + TSI), g = t.getUTCDay(), gece = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - TSI;
  let bas = gece + ((6 - g + 7) % 7) * GUN + T_BAS * 36e5, son = bas + (T_SON - T_BAS) * 36e5;
  if (now >= son + T_PAY) { bas += 7 * GUN; son += 7 * GUN; }
  if (/[?&]turnuvatest/.test(location.search)) { bas = now - 36e5; son = now + 2 * 36e5; }
  const acik = now >= bas && now < son, sayar = now >= bas && now < son + T_PAY, onceki = now >= bas ? bas : bas - 7 * GUN;
  return { acik, sayar, bas, son, kalan: acik ? son - now : sayar ? son + T_PAY - now : bas - now, anahtar: tsiGun(sayar ? bas : onceki), gosterilen: tsiGun(onceki), tarih: new Date(onceki).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) };
}
async function turnuvaSirala(anahtar) {
  await baglan(); const L = await DB.ilk('masa_turnuva/' + anahtar, 'g', 60);
  const A = Object.entries(L || {}).map(([u, v]) => Object.assign({ u }, v)).filter(x => x && x.o > 0).sort((a, b) => b.g - a.g || a.o - b.o || a.t - b.t);
  return { liste: A.slice(0, 30), ben: A.find(x => x.u === UID) || null, sira: A.findIndex(x => x.u === UID) + 1 };
}
const sure = ms => { ms = Math.max(0, ms); const g = Math.floor(ms / GUN), s = Math.floor(ms / 36e5) % 24, d = Math.floor(ms / 6e4) % 60, n = Math.floor(ms / 1e3) % 60; return g ? `${g} gün ${s} sa` : s ? `${s} sa ${d} dk` : `${d} dk ${p2(n)} sn`; };
/* ---------- arkadaşlar ve davetler ----------
   ob-arkadas (bu cihaz) = [{ u, n, t }] · ob-masa-son = son masa arkadaşları [{ u, n, o: oyun, t }]
   durum/<uid> = { n, t } (son görülme) · davet/<alıcı>/<gönderen> = { n, o: oyun, k: oda kodu, t } */
const ARK = 'ob-arkadas', SON = 'ob-masa-son';
const jOku = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }, jYaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const arkadaslar = () => jOku(ARK), arkadasMi = u => arkadaslar().some(x => x.u === u);
function arkadasEkle(u, n) { if (!u || u === UID) return; const L = arkadaslar().filter(x => x.u !== u); L.unshift({ u, n: String(n || '?').slice(0, 16), t: Date.now() }); jYaz(ARK, L.slice(0, 60)); arkaPlan(); }
function arkadasSil(u) { jYaz(ARK, arkadaslar().filter(x => x.u !== u)); }
function sonRakipler() { const A = new Set(arkadaslar().map(x => x.u)); return jOku(SON).filter(x => !A.has(x.u)).slice(0, 20); }
function sonEkle(K, oyun) { const L = jOku(SON); for (const x of K) { if (!x || x.uid === UID) continue; const i = L.findIndex(y => y.u === x.uid); if (i >= 0) L.splice(i, 1); L.unshift({ u: x.uid, n: x.n, o: oyun, t: Date.now() }); } jYaz(SON, L.slice(0, 30)); }
async function durumlar(L) { await baglan(); const simdi = DB.now(), R = {}; await Promise.all(L.slice(0, 30).map(x => DB.get('durum/' + x.u).then(v => { R[x.u] = v && simdi - v.t < 150000; }).catch(() => { }))); return R; }
async function davetEt(u, oyun, kod) { await baglan(); return DB.set('davet/' + u + '/' + UID, { n: (adAl() || '?').slice(0, 16), o: oyun, k: kod, t: DB.now() }); }
let arkaBasladi = false, davetGor = {};
const DCSS = `.ms-davet{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:90;width:min(380px,94vw);padding:12px 14px;border-radius:16px;background:var(--card,#fff);color:var(--ink,#111);box-shadow:0 12px 40px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:8px;font-weight:800;animation:msA .2s}
.ms-davet div{display:flex;gap:8px}.ms-davet button{flex:1;padding:10px;border-radius:11px;font-weight:800;background:var(--accent-soft,#eef);color:var(--accent-ink,#223)}.ms-davet button.ana{background:var(--accent,#4f46e5);color:#fff}`;
function davetGoster(g, v) {
  if (davetGor[g + v.t]) return; davetGor[g + v.t] = 1; if (!document.getElementById('ms-dcss')) { const st = document.createElement('style'); st.id = 'ms-dcss'; st.textContent = DCSS; document.head.appendChild(st); }
  const d = document.createElement('div'); d.className = 'ms-davet'; d.innerHTML = `<span>📨 <b>${esc(v.n)}</b> seni <b>${esc(ADLAR_OYUN[v.o] || v.o)}</b> masasına çağırıyor.</span><div><button data-x="hayir">Sonra</button><button class="ana" data-x="evet">Katıl</button></div>`;
  document.body.appendChild(d); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) { }
  const kapa = () => { d.remove(); DB.remove('davet/' + UID + '/' + g).catch(() => { }); };
  d.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; kapa(); if (b.dataset.x === 'evet') location.href = location.pathname + '?masa=' + encodeURIComponent(v.k) + (/[?&]masasahte/.test(location.search) ? '&masasahte' : '') + '#o/' + v.o; });
  setTimeout(() => { if (d.isConnected) d.remove(); }, 60000);
}
async function arkaPlan() {
  if (arkaBasladi) return; arkaBasladi = true;
  try { await baglan(); } catch (e) { arkaBasladi = false; return; }
  const nabiz = () => { if (adAl()) DB.set('durum/' + UID, { n: adAl().slice(0, 16), t: DB.now() }).catch(() => { }); };
  nabiz(); setInterval(nabiz, 60000);
  DB.on('davet/' + UID, v => { if (!v) return; const simdi = DB.now(); for (const g in v) { const x = v[g]; if (!x || simdi - x.t > 5 * 60000) { DB.remove('davet/' + UID + '/' + g).catch(() => { }); continue; } davetGoster(g, x); } });
  turnuvaOdul().catch(() => { });
}
setTimeout(() => { if (arkadaslar().length || jOku(SON).length) arkaPlan(); }, 2500);
/* ---------- Elo puanı (iki kişilik oyunlar) ----------
   elo/<oyun>/<uid> = { r, o: oyun sayısı, n, t } — herkes yalnız kendi puanını yazar; kural tek oyunda en çok 40 puan oynamaya izin verir. */
const ELO_OYUN = ['tavla', 'satranc', 'dama', 'mangala', 'dokuztas', 'amiral', 'kelimemasasi'];
async function eloAl(oyun, u) { await baglan(); const v = await DB.get('elo/' + oyun + '/' + (u || UID)).catch(() => null); return v || { r: 1200, o: 0 }; }
async function eloGuncelle(oda, r) {
  const K = oda.koltuklar(), x = K.find(y => y && y.uid !== UID); if (!x) return;
  const [ben, o] = await Promise.all([eloAl(oda.oyun), eloAl(oda.oyun, x.uid)]); const e = 1 / (1 + Math.pow(10, (o.r - ben.r) / 400)), k = ben.o < 20 ? 32 : 20;
  const yeniR = Math.round(Math.max(100, Math.min(3000, ben.r + Math.max(-40, Math.min(40, k * (r - e))))));
  await DB.tx('elo/' + oda.oyun + '/' + UID, c => { c = c || { r: 1200, o: 0 }; const simdi = DB.now(); if (simdi < (c.t || 0) + 10000) return; return { r: Math.max(c.r - 40, Math.min(c.r + 40, yeniR)), o: (c.o || 0) + 1, n: (adAl() || '?').slice(0, 16), t: simdi }; }).catch(() => { });
}
async function eloSira(oyun) { await baglan(); const L = await DB.ilk('elo/' + oyun, 'r', 30); return Object.entries(L || {}).map(([u, v]) => Object.assign({ u }, v)).filter(x => x && x.o > 0).sort((a, b) => b.r - a.r); }
/* ---------- turnuva madalyaları ve ayın şampiyonu ---------- */
const MADALYA = 'ob-turnuva-madalya', SAMP = 'ob-turnuva-samp';
async function turnuvaOdul() {
  await baglan(); const T = turnuva(); if (T.sayar) return; const anah = T.gosterilen, M = jOku(MADALYA);
  if (!M.includes(anah)) { const R = await turnuvaSirala(anah); const i = R.liste.slice(0, 3).findIndex(x => x.u === UID);
    if (R.liste.length) { M.push(anah); jYaz(MADALYA, M.slice(-60)); } if (i >= 0) { try { window.Progress && Progress.olay('turnuva_' + (i + 1)); window.OB_bildir && OB_bildir(['🥇', '🥈', '🥉'][i] + ' Cumartesi turnuvasında ' + (i + 1) + '. oldun!'); } catch (e) { } } }
  let c = null; try { c = JSON.parse(localStorage.getItem(SAMP) || 'null'); } catch (e) { }
  const ay = anah.slice(0, 7); if (c && c.ay === ay && c.k === anah) return;
  const gunler = []; for (let d = new Date(Date.UTC(+ay.slice(0, 4), +ay.slice(5, 7) - 1, 1)); d.getUTCMonth() === +ay.slice(5, 7) - 1; d.setUTCDate(d.getUTCDate() + 1)) { const k = d.toISOString().slice(0, 10); if (d.getUTCDay() === 6 && k <= anah) gunler.push(k); }
  const P = {}; for (const g of gunler) { const R = await turnuvaSirala(g).catch(() => ({ liste: [] })); R.liste.slice(0, 3).forEach((x, i) => { const z = P[x.u] || (P[x.u] = { n: x.n, p: 0, g: 0 }); z.p += 3 - i; z.g += x.g; z.n = x.n; }); }
  const en = Object.entries(P).sort((a, b) => b[1].p - a[1].p || b[1].g - a[1].g)[0];
  try { localStorage.setItem(SAMP, JSON.stringify({ ay, k: anah, n: en ? en[1].n : '', p: en ? en[1].p : 0, u: en ? en[0] : '', ben: en ? en[0] === UID : false })); } catch (e) { }
}
function sampiyon() { try { const c = JSON.parse(localStorage.getItem(SAMP) || 'null'); return c && c.n ? c : null; } catch (e) { return null; } }
async function siralama() {
  await baglan(); const L = await DB.ilk('masa_sira/' + hafta(), 'g', 60);
  const A = Object.entries(L || {}).map(([u, v]) => Object.assign({ u }, v)).filter(x => x && x.o > 0).sort((a, b) => b.g - a.g || a.o - b.o || a.t - b.t);
  let ben = A.find(x => x.u === UID) || null; if (!ben) { const v = await DB.get('masa_sira/' + hafta() + '/' + UID).catch(() => null); if (v) ben = Object.assign({ u: UID }, v); }
  return { liste: A.slice(0, 30), ben, sira: A.findIndex(x => x.u === UID) + 1 };
}

/* ---------- ortak lobi arayüzü ---------- */
const CSS = `
.ms{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin:0 auto}
.ms h3{margin:0;font-size:19px;font-weight:800}.ms p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.ms input{width:100%;padding:11px 12px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-weight:800;font-size:16px}
.ms input:focus{outline:none;border-color:var(--accent)}
.ms-b{padding:12px 14px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:15px;text-align:center}.ms-b.ana{background:var(--accent);color:#fff}.ms-b:disabled{opacity:.5}
.ms-sat{display:flex;gap:8px}.ms-sat>*{flex:1;min-width:0}
.ms-kod{font-size:34px;font-weight:800;letter-spacing:.18em;text-align:center;padding:10px;border-radius:14px;background:var(--bg2);font-variant-numeric:tabular-nums}
.ms-o{display:flex;flex-direction:column;gap:6px}.ms-o div{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;background:var(--bg2);font-weight:800}
.ms-o div i{font-style:normal;margin-left:auto;font-size:12px;color:var(--ink-soft)}.ms-o div.bos{opacity:.55;font-weight:700}
.ms-hata{color:var(--bad);font-weight:800;font-size:13.5px;min-height:18px}
.ms-sira{display:flex;flex-direction:column;gap:3px;max-height:52vh;overflow:auto}.ms-sira div{display:grid;grid-template-columns:30px 1fr auto auto;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:14px}
.ms-sira div i{font-style:normal;color:var(--ink-soft);font-size:12.5px;text-align:right}.ms-sira div b{font-variant-numeric:tabular-nums}.ms-sira div.sen{box-shadow:inset 0 0 0 2px var(--accent)}.ms-sira div span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ms-tur{display:flex;flex-direction:column;gap:2px;text-align:left;padding:10px 14px;border-radius:13px;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#78350f;font-size:13px}.ms-tur b{font-size:14.5px}.ms-tur span{font-weight:700;opacity:.85}
.ms-tur.canli{background:linear-gradient(135deg,#fee2e2,#fecaca);color:#7f1d1d;animation:msTur 2s infinite}@keyframes msTur{50%{box-shadow:0 0 0 4px rgba(239,68,68,.25)}}
.ms-mini{flex:none;padding:5px 10px;border-radius:9px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:12.5px}.ms-mini.ana{background:var(--accent);color:#fff}.ms-mini:disabled{opacity:.6}
.ms-sira .bos{display:block;text-align:center;color:var(--ink-soft);font-weight:700}
.ms-izle-rozet{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 8px);transform:translateX(-50%);z-index:80;padding:5px 12px;border-radius:999px;background:#111827;color:#fff;font-weight:800;font-size:12.5px;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none}
.ms-izliyor [data-a=yine],.ms-izliyor [data-a=teslim],.ms-izliyor [data-a=bitir],.ms-izliyor [data-a=at],.ms-izliyor [data-a=ac],.ms-izliyor [data-a=geri],.ms-izliyor [data-a=ipucu]{display:none!important}
.ms-karsi{font-size:12.5px!important;font-weight:800!important;color:var(--accent-ink)!important;margin:0}
`;
/* lobi(kok, { oyun, koltuk, baslik, enAz, botlu, onOda(oda), onGeri() }) : oda kurulup oyun başlayınca onOda çağrılır */
function lobi(kok, o) {
  if (!document.getElementById('ms-css')) { const s = document.createElement('style'); s.id = 'ms-css'; s.textContent = CSS; document.head.appendChild(s); }
  let oda = null, birak = null, bitti = false;
  const el = document.createElement('div'); el.className = 'ms'; kok.innerHTML = ''; kok.appendChild(el);
  const q = s => el.querySelector(s), hata = m => { const h = q('.ms-hata'); if (h) h.textContent = m || ''; };
  function giris() {
    el.innerHTML = `<h3>🌐 ${esc(o.baslik)} · çevrimiçi</h3><p>Adını yaz; hızlı eşleş ya da bir arkadaşınla özel oda kur. Hesap gerekmez.</p>
      <input id="ms-ad" maxlength="14" placeholder="Adın" value="${esc(adAl())}" autocomplete="off">
      <button class="ms-b ana" data-a="hizli">⚡ Hızlı eşleş</button>
      <div class="ms-sat"><button class="ms-b" data-a="kur">🔒 Özel oda kur</button><button class="ms-b" data-a="kodla">🔑 Koda katıl</button></div>
      <div class="ms-sat" id="ms-kodsat" hidden><input id="ms-kod" maxlength="5" placeholder="KOD" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;text-align:center"><button class="ms-b ana" data-a="katil" style="flex:.6">Katıl</button></div>
      <div class="ms-hata"></div><div class="ms-sat"><button class="ms-b" data-a="arkadas">👥 Arkadaşlar</button><button class="ms-b" data-a="izleListe">👀 İzle</button><button class="ms-b" data-a="sira">🏆 Sıralama</button></div>
      ${ELO_OYUN.includes(o.oyun) ? '<button class="ms-b" data-a="elo" id="ms-elo">🏅 Puanın yükleniyor…</button>' : ''}
      <button class="ms-tur" data-a="turnuva" id="ms-tur"></button><button class="ms-b" data-a="geri">‹ Geri</button>`;
    turSaat(); arkaPlan();
    if (ELO_OYUN.includes(o.oyun)) eloAl(o.oyun).then(v => { const x = q('#ms-elo'); if (x) x.innerHTML = `🏅 ${esc(ADLAR_OYUN[o.oyun] || '')} puanın: <b>${v.r}</b>${v.o ? ` · ${v.o} oyun` : ' · henüz oyun yok'} · puan tablosu`; }).catch(() => { const x = q('#ms-elo'); if (x) x.textContent = '🏅 Puan tablosu'; });
    const m = new URLSearchParams(location.search).get('masa'); if (m && !lobi._kullanildi) { lobi._kullanildi = true; q('#ms-kodsat').hidden = false; q('#ms-kod').value = m.toUpperCase().slice(0, 5); if (adAl()) is('katil'); else hata('Adını yazıp Katıl’a bas.'); }
  }
  async function izleGoster() {
    el.innerHTML = `<h3>👀 Oynanan masalar</h3><p>Şu an oynanan bir masayı seyret ya da arkadaşının oda kodunu yaz. İzlerken oyuna karışamazsın.</p><div class="ms-sira" id="ms-canli"><div class="bos">Yükleniyor…</div></div>
      <div class="ms-sat"><input id="ms-ikod" maxlength="5" placeholder="KOD" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;text-align:center"><button class="ms-b ana" data-a="izleKod" style="flex:.6">İzle</button></div><div class="ms-hata"></div><button class="ms-b" data-a="girisDon">‹ Geri</button>`;
    try { const L = await canliListe(o.oyun), x = el.querySelector('#ms-canli'); if (!x) return;
      x.innerHTML = L.length ? L.map(m => `<div data-izle="${esc(m.kod)}" style="cursor:pointer"><b>▶</b><span>${esc(m.n)}</span><b>${esc(m.kod)}</b><i>izle</i></div>`).join('') : '<div class="bos">Şu an oynanan açık masa yok.</div>';
      x.querySelectorAll('[data-izle]').forEach(d => d.onclick = () => izleBasla(d.dataset.izle)); } catch (e) { const x = el.querySelector('#ms-canli'); if (x) x.innerHTML = '<div class="bos">Liste yüklenemedi.</div>'; }
  }
  async function izleBasla(kod) {
    try { const oda = await izle(o.oyun, kod); if (!o.onIzle) { oda.ayril(); return hata('Bu oyunda izleme yok.'); } bitti = true; kapat(); o.onIzle(oda); } catch (e) { hata(e.message || 'İzlenemedi.'); }
  }
  let turT = 0;
  function turSaat() {
    clearTimeout(turT); const x = q('#ms-tur'); if (!x || !el.isConnected) return; const T = turnuva();
    x.classList.toggle('canli', T.acik);
    x.innerHTML = T.acik ? `<b>🔴 Cumartesi Turnuvası sürüyor</b><span>Kazandığın her çevrimiçi oyun turnuvaya sayılır · bitimine ${sure(T.kalan)}</span>`
      : T.sayar ? `<b>🏁 Cumartesi Turnuvası bitti</b><span>Süren oyunlar ${sure(T.kalan)} içinde biterse sayılır · tabloyu gör</span>`
      : `<b>🏆 Cumartesi Turnuvası</b><span>Her cumartesi 20.00–23.00 · başlamasına ${sure(T.kalan)} · tabloyu gör</span>`;
    turT = setTimeout(turSaat, 1000);
  }
  async function turnuvaGoster() {
    const T = turnuva();
    el.innerHTML = `<h3>🏆 Cumartesi Turnuvası</h3><p>${T.acik ? `<b>Şu an sürüyor!</b> Bitimine ${sure(T.kalan)}.` : T.sayar ? 'Turnuva bitti; son oyunlar sayılıyor.' : `${T.tarih} turnuvasının sonuçları. Sıradaki turnuva cumartesi 20.00’de, ${sure(T.kalan)} sonra.`}</p>
      <p>Cumartesi 20.00–23.00 arasında biten, en az iki kişinin oynadığı bütün çevrimiçi masa oyunları (tavla, okey, 101, batak, king, pişti, dama, satranç) sayılır. En çok galibiyet alan birinci olur; eşitlikte daha az oyunla kazanan öne geçer.</p>
      <div class="ms-sira"><div class="bos">Yükleniyor…</div></div><p id="ms-ben"></p>${T.acik ? '<button class="ms-b ana" data-a="hizli2">⚡ Hemen bir maça katıl</button>' : ''}<button class="ms-b" data-a="girisDon">‹ Geri</button>`;
    try {
      const R = await turnuvaSirala(T.sayar ? T.anahtar : T.gosterilen); if (!el.querySelector('.ms-sira')) return;
      el.querySelector('.ms-sira').innerHTML = R.liste.length ? R.liste.map((x, i) => `<div class="${x.u === UID ? 'sen' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(x.n || '?')}${x.u === UID ? ' (sen)' : ''}</span><b>${x.g}</b><i>${x.o} oyun</i></div>`).join('') : `<div class="bos">${T.sayar ? 'Henüz biten oyun yok. İlk galibiyeti sen al!' : 'Bu turnuvada oyun bitmedi.'}</div>`;
      el.querySelector('#ms-ben').innerHTML = R.ben ? `Sen: <b>${R.ben.g}</b> galibiyet, <b>${R.ben.o}</b> oyun${R.sira ? ` · <b>${R.sira}.</b> sıradasın` : ''}.` : T.sayar ? 'Turnuvada henüz oyun bitirmedin.' : '';
      if (!T.sayar && R.liste.length) { const b1 = R.liste[0]; el.querySelector('#ms-ben').innerHTML = `👑 Birinci: <b>${esc(b1.n || '?')}</b> (${b1.g} galibiyet)` + (R.ben ? ` · sen ${R.sira}. oldun` : ''); }
    } catch (e) { const x = el.querySelector('.ms-sira'); if (x) x.innerHTML = '<div class="bos">Tablo yüklenemedi. İnternetini kontrol et.</div>'; }
  }
  async function eloGoster() {
    el.innerHTML = `<h3>🏅 ${esc(ADLAR_OYUN[o.oyun] || o.baslik)} puan tablosu</h3><p>Herkes 1200 puanla başlar. Güçlü rakibi yenmek çok, zayıfa yenilmek çok puan götürür (Elo). Hızlı eşleşme sana yakın puandaki rakibi önce dener.</p><div class="ms-sira"><div class="bos">Yükleniyor…</div></div><p id="ms-ben"></p><button class="ms-b" data-a="girisDon">‹ Geri</button>`;
    try { const [L, ben] = await Promise.all([eloSira(o.oyun), eloAl(o.oyun)]); if (!el.querySelector('.ms-sira')) return;
      el.querySelector('.ms-sira').innerHTML = L.length ? L.map((x, i) => `<div class="${x.u === UID ? 'sen' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(x.n || '?')}${x.u === UID ? ' (sen)' : ''}</span><b>${x.r}</b><i>${x.o} oyun</i></div>`).join('') : '<div class="bos">Henüz puanlı oyun yok.</div>';
      el.querySelector('#ms-ben').innerHTML = `Senin puanın: <b>${ben.r}</b>${ben.o ? ` (${ben.o} oyun)` : ''}`;
    } catch (e) { const x = el.querySelector('.ms-sira'); if (x) x.innerHTML = '<div class="bos">Tablo yüklenemedi.</div>'; }
  }
  async function arkadasGoster(odadan) {
    const A = arkadaslar(), S2 = sonRakipler();
    el.innerHTML = `<h3>👥 Arkadaşlar</h3><p>${odadan ? 'Çağırdığın arkadaşına bildirim gider; Katıl’a basınca bu odaya gelir.' : 'Son oynadığın kişileri ekle, sonra özel oda kurup tek dokunuşla çağır. Arkadaşların sitede açıkken çağrın anında görünür.'}</p>
      <div class="ms-sira" id="ms-ark">${A.length ? A.map(x => `<div data-u="${esc(x.u)}"><b class="dot">⚪</b><span>${esc(x.n)}</span>${odadan ? '<button class="ms-mini ana" data-cagir="1">Çağır</button>' : '<button class="ms-mini" data-sil="1">✕</button>'}</div>`).join('') : '<div class="bos">Henüz arkadaşın yok. Aşağıdaki son rakiplerinden ekleyebilirsin.</div>'}</div>
      ${!odadan && S2.length ? `<p><b>Son masa arkadaşların</b></p><div class="ms-sira">${S2.map(x => `<div data-u="${esc(x.u)}" data-n="${esc(x.n)}"><b>·</b><span>${esc(x.n)}</span><i>${esc(ADLAR_OYUN[x.o] || x.o)}</i><button class="ms-mini" data-ekle="1">⭐ Ekle</button></div>`).join('')}</div>` : ''}
      ${!odadan && A.length ? '<button class="ms-b ana" data-a="kurCagir">🔒 Özel oda kur ve arkadaş çağır</button>' : ''}<div class="ms-hata"></div><button class="ms-b" data-a="${odadan ? 'odaDon' : 'girisDon'}">‹ Geri</button>`;
    el._odadan = !!odadan;
    if (A.length) durumlar(A).then(R => A.forEach(x => { const d = el.querySelector(`#ms-ark [data-u="${CSS.escape(x.u)}"] .dot`); if (d) { d.textContent = R[x.u] ? '🟢' : '⚪'; d.title = R[x.u] ? 'Çevrimiçi' : 'Çevrimdışı'; } })).catch(() => { });
  }
  async function siraGoster() {
    el.innerHTML = `<h3>🏆 Haftanın sıralaması</h3><p>${haftaAraligi()} · Çevrimiçi masa oyunlarında en az iki kişinin oynadığı oyunlardaki galibiyetler. Pazartesi sıfırlanır.</p><div class="ms-sira"><div class="bos">Yükleniyor…</div></div><p id="ms-ben"></p><button class="ms-b" data-a="girisDon">‹ Geri</button>`;
    try {
      const R = await siralama(); if (!el.querySelector('.ms-sira')) return;
      el.querySelector('.ms-sira').innerHTML = R.liste.length ? R.liste.map((x, i) => `<div class="${x.u === UID ? 'sen' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(x.n || '?')}${x.u === UID ? ' (sen)' : ''}</span><b>${x.g}</b><i>${x.o} oyun</i></div>`).join('') : '<div class="bos">Bu hafta henüz kimse kazanmadı. İlk sen ol!</div>';
      el.querySelector('#ms-ben').innerHTML = R.ben ? `Sen bu hafta: <b>${R.ben.g}</b> galibiyet, <b>${R.ben.o}</b> oyun${R.sira ? ` · <b>${R.sira}.</b> sıradasın` : ''}.` : 'Bu hafta henüz çevrimiçi oyun bitirmedin.';
    } catch (e) { const x = el.querySelector('.ms-sira'); if (x) x.innerHTML = '<div class="bos">Sıralama yüklenemedi. İnternetini kontrol et.</div>'; }
  }
  async function is(a) {
    const ad = adKoy(q('#ms-ad') ? q('#ms-ad').value : adAl()); if (!ad) { hata('Önce bir ad yaz.'); const i = q('#ms-ad'); if (i) i.focus(); return; }
    hata(''); el.querySelectorAll('button').forEach(b => b.disabled = true);
    try { oda = a === 'hizli' ? await hizli(o.oyun, o.koltuk, ad) : a === 'kur' ? await kur(o.oyun, o.koltuk, false, ad) : await katil(o.oyun, q('#ms-kod').value, ad); bekle(); if (el._cagir) { el._cagir = false; el._odadan = false; setTimeout(() => { if (oda) arkadasGoster(true); }, 300); } }
    catch (e) { el.querySelectorAll('button').forEach(b => b.disabled = false); hata(/yüklenemedi|network|Failed/i.test(e.message || '') ? 'Sunucuya bağlanılamadı. İnternetini kontrol et.' : /PERMISSION|permission/i.test(e.message || e.code || '') ? 'Sunucu izin vermedi (kurallar güncel değil).' : (e.message || 'Bir şey ters gitti.')); }
  }
  function bekle() {
    birak = oda.dinle((v, h) => {
      if (bitti || (el._odadan && !(v && v.d >= 1 && v.g))) return; if (!v) { hata('Oda kapandı.'); return giris(); }
      if (v.d >= 1 && v.g) { bitti = true; if (birak) birak(); return o.onOda(oda); }
      const K = oda.koltuklar(), n = K.filter(Boolean).length, yon = oda.yonetici(), link = location.origin + location.pathname + '?masa=' + oda.kod + '#o/' + o.oyun;
      el.innerHTML = `<h3>${v.a ? '⚡ Rakip aranıyor…' : '🔒 Özel oda'}</h3><div class="ms-kod">${oda.kod}</div>
        <p>${v.a ? 'Biri gelince oyun başlar. Kodu arkadaşına da verebilirsin.' : 'Bu kodu ya da bağlantıyı arkadaşına gönder.'}</p>
        <div class="ms-sat"><button class="ms-b" data-a="kopya">🔗 Bağlantıyı kopyala</button>${navigator.share ? '<button class="ms-b" data-a="paylas">📤 Paylaş</button>' : ''}</div>
        <div class="ms-o">${K.map((x, i) => x ? `<div>${x.uid === oda.uid ? '🟢' : '🔵'} ${esc(x.n)}${x.uid === oda.uid ? ' (sen)' : ''}<i>${(() => { const k = x.uid !== oda.uid && karsi(o.oyun, x.uid), P = []; if (k && (k.g + k.k + k.b)) P.push(`aranızda ${k.g}–${k.k}${k.b ? '–' + k.b : ''}`); if (i === 0) P.push('kurucu'); return P.join(' · '); })()}</i></div>` : `<div class="bos">⚪ ${o.botlu ? 'boş (başlayınca bilgisayar oturur)' : 'bekleniyor…'}</div>`).join('')}</div>
        ${yon ? `<button class="ms-b ana" data-a="baslat" ${n >= o.enAz ? '' : 'disabled'}>${n >= o.koltuk ? 'Başlat' : o.botlu && n >= o.enAz ? 'Boş koltuklara bilgisayar otursun, başlat' : 'Oyuncu bekleniyor…'}</button>` : '<p style="text-align:center">Kurucunun başlatması bekleniyor…</p>'}
        ${arkadaslar().length && n < o.koltuk ? '<button class="ms-b" data-a="cagirListe">👥 Arkadaşını çağır</button>' : ''}<div class="ms-hata"></div><button class="ms-b" data-a="cik">‹ Odadan çık</button>`;
      el._link = link;
      if (yon && !o.botlu && n >= o.koltuk && !bekle._b) { bekle._b = true; setTimeout(() => { bekle._b = false; if (!bitti) o.baslat(oda); }, 700); }
    });
  }
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.a;
    if (b.dataset.ekle) { const r = b.closest('[data-u]'); arkadasEkle(r.dataset.u, r.dataset.n); b.textContent = '✓'; b.disabled = true; return; }
    if (b.dataset.sil) { const r = b.closest('[data-u]'); arkadasSil(r.dataset.u); r.remove(); return; }
    if (b.dataset.cagir) { const r = b.closest('[data-u]'); if (!oda) return; davetEt(r.dataset.u, o.oyun, oda.kod).then(() => { b.textContent = '✓ Çağrıldı'; b.disabled = true; }).catch(() => hata('Çağrı gönderilemedi (kurallar güncel olmayabilir).')); return; }
    if (a === 'arkadas') arkadasGoster(false); else if (a === 'cagirListe') arkadasGoster(true); else if (a === 'odaDon') { el._odadan = false; const x = oda; if (birak) birak(); birak = null; oda = x; bekle(); }
    else if (a === 'kurCagir') { el._cagir = true; is('kur'); } else if (a === 'elo') eloGoster(); else
    if (a === 'turnuva') turnuvaGoster(); else if (a === 'hizli2') { giris(); is('hizli'); } else
    if (a === 'geri') { kapat(); o.onGeri && o.onGeri(); } else if (a === 'sira') siraGoster(); else if (a === 'izleListe') izleGoster(); else if (a === 'izleKod') izleBasla((q('#ms-ikod') || {}).value); else if (a === 'girisDon') giris(); else if (a === 'kodla') { q('#ms-kodsat').hidden = false; q('#ms-kod').focus(); }
    else if (a === 'hizli' || a === 'kur' || a === 'katil') is(a);
    else if (a === 'kopya') { try { navigator.clipboard.writeText(el._link); b.textContent = '✓ Kopyalandı'; } catch (x) { hata(el._link); } }
    else if (a === 'paylas') navigator.share({ text: o.baslik + ' oynayalım mı? Kod: ' + oda.kod, url: el._link }).catch(() => { });
    else if (a === 'baslat') { b.disabled = true; o.baslat(oda); }
    else if (a === 'cik') { const x = oda; kapat(); if (x) x.ayril(); giris(); } });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ms-kod') is('katil'); e.stopPropagation(); });
  function kapat() { clearTimeout(turT); if (birak) birak(); birak = null; oda = null; }
  giris();
  return { kapat() { bitti = true; const x = oda; kapat(); return x; } };
}
/* ---------- masa içi hazır ifadeler ---------- */
const IFADE = ['Selam! 👋', 'İyi oyunlar 🍀', 'Güzel hamle 👏', 'Hadi ama 😄', 'Şanslısın 😏', 'Biraz hızlı 🙏', 'Bekle, düşünüyorum 🤔', 'Hay aksi 😅', 'Tebrikler 🎉', 'Rövanş? 🔁', 'Teşekkürler 🙂', '👍', '😂', '😮'];
const SCSS = `
.ms-sb{flex:none!important;width:44px;padding:11px 0!important;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-size:18px;line-height:1;text-align:center}
.ms-sp{position:fixed;z-index:70;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;width:min(320px,92vw);border-radius:16px;background:var(--card);box-shadow:0 12px 40px rgba(0,0,0,.3);animation:msA .15s}
.ms-sp button{padding:10px 8px;border-radius:11px;background:var(--bg2);color:var(--ink);font-weight:800;font-size:14px;text-align:center}
.ms-bal{position:fixed;z-index:65;max-width:200px;padding:7px 11px;border-radius:14px;background:#fff;color:#1f2328;font-weight:800;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.3);pointer-events:none;transform:translate(-50%,-100%);animation:msB 3.2s forwards;white-space:nowrap}
.ms-bal::after{content:'';position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#fff}
.ms-bal.alt{transform:translate(-50%,0)}.ms-bal.alt::after{bottom:auto;top:-6px;border:6px solid transparent;border-top:0;border-bottom-color:#fff}
@keyframes msA{from{opacity:0;transform:translateY(6px)}}@keyframes msB{0%{opacity:0;margin-top:6px}8%{opacity:1;margin-top:0}85%{opacity:1}100%{opacity:0}}
`;
/* sohbet(oda, { yer: düğmenin ekleneceği öğe, sonra: bu öğeden sonra ekle, koltuk: koltuk no → balonun çıkacağı öğe }) */
function sohbet(oda, o) {
  if (!oda || !o.yer || oda.izleyici) return { kapat() { } };
  if (!document.getElementById('ms-scss')) { const st = document.createElement('style'); st.id = 'ms-scss'; st.textContent = SCSS; document.head.appendChild(st); }
  const d = document.createElement('button'); d.className = 'ms-sb'; d.type = 'button'; d.textContent = '💬'; d.setAttribute('aria-label', 'Hazır mesaj gönder');
  if (o.sonra && o.sonra.parentNode === o.yer) o.sonra.after(d); else o.yer.appendChild(d);
  let pano = null, son = 0;
  const kapatPano = () => { if (pano) { pano.remove(); pano = null; } };
  const disari = e => { if (pano && !pano.contains(e.target) && e.target !== d) kapatPano(); };
  d.addEventListener('click', e => { e.stopPropagation(); if (pano) return kapatPano();
    pano = document.createElement('div'); pano.className = 'ms-sp'; pano.innerHTML = IFADE.map((x, i) => `<button type="button" data-i="${i}">${esc(x)}</button>`).join('');
    document.body.appendChild(pano); const r = d.getBoundingClientRect(), w = pano.offsetWidth; pano.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; pano.style.bottom = (innerHeight - r.top + 8) + 'px';
    pano.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.target.closest('button'); if (!b) return; const simdi = Date.now(); if (simdi - son < 2500) return; son = simdi; oda.mesaj(+b.dataset.i); kapatPano(); }); });
  document.addEventListener('pointerdown', disari, true);
  function balon(uid, i) {
    const K = oda.koltuklar(), k = K.findIndex(x => x && x.uid === uid); if (k < 0 || !IFADE[i]) return;
    const el = o.koltuk && o.koltuk(k); if (!el || !el.isConnected) return; const r = el.getBoundingClientRect(), b = document.createElement('div');
    document.querySelectorAll('.ms-bal').forEach(x => { if (x.dataset.u === uid) x.remove(); }); b.className = 'ms-bal'; b.dataset.u = uid; b.textContent = IFADE[i]; let y = r.top - 6; if (y < 70) { y = r.bottom + 6; b.classList.add('alt'); }
    b.style.left = Math.max(70, Math.min(innerWidth - 70, r.left + r.width / 2)) + 'px'; b.style.top = y + 'px'; document.body.appendChild(b); setTimeout(() => b.remove(), 3300);
    try { if (uid !== oda.uid && navigator.vibrate) navigator.vibrate(15); } catch (e) { }
  }
  const birak = oda.mesajDinle(balon);
  return { kapat() { birak(); kapatPano(); d.remove(); document.removeEventListener('pointerdown', disari, true); } };
}
window.Masa = { simdi: () => DB ? DB.now() : Date.now(), izle, canliListe, baglan, kur, katil, hizli, lobi, sohbet, IFADE, adAl, adKoy, sonuc, karsi, karsiYazi, siralama, hafta, turnuva, turnuvaSirala, arkadaslar, arkadasEkle, arkadasSil, sonRakipler, davetEt, durumlar, eloAl, eloSira, sampiyon, turnuvaOdul, ADLAR_OYUN, get uid() { return UID; } };
})();
