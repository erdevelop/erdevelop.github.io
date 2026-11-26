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
  const kok = yol(oyun, kod), dinleyen = new Set(); let veri = null, kapat = null, nabiz = 0, ayrildi = false;
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
    async baslat(s) { const m = JSON.stringify(s); const r = await DB.tx(kok + '/g', c => c ? undefined : { v: 1, s: m }); if (r.ok) { await DB.update(kok, { d: 1 }); DB.remove('masa/' + oyun + '/acik/' + kod).catch(() => { }); } return r.ok; },
    bitir() { return DB.update(kok, { d: 2 }).catch(() => { }); },
    yeniden(s) { return DB.update(kok, { d: 1, g: { v: oda.surum() + 1, s: JSON.stringify(s) } }); },
    async ayril() { if (ayrildi) return; ayrildi = true; clearInterval(nabiz); if (kapat) kapat(); dinleyen.clear();
      try { await DB.kopuncaIptal(kok + '/o/' + UID); const bekliyor = veri && veri.d === 0, tek = veri && veri.o && Object.keys(veri.o).filter(u => u !== UID && !veri.o[u].x).length === 0;
        if (tek) { await DB.remove(kok); await DB.remove('masa/' + oyun + '/acik/' + kod); } else if (bekliyor) { await DB.remove(kok + '/o/' + UID); dizin(veri, true); } else await DB.update(kok + '/o/' + UID, { x: DB.now() }); } catch (e) { } },
  };
  function dizin(v, benYok) { if (!v || !v.a || v.d !== 0) return; const n = Object.keys(v.o || {}).filter(u => !(benYok && u === UID)).length; DB.update('masa/' + oyun + '/acik/' + kod, { t: DB.now(), u: v.h, n: (v.o && v.o[v.h] && v.o[v.h].n) || '?', b: Math.max(0, (v.k || 2) - n) }).catch(() => { }); }
  kapat = DB.on(kok, (v, hata) => { if (ayrildi) return; veri = v; dinleyen.forEach(f => { try { f(v, hata); } catch (e) { console.error(e); } }); });
  /* kopunca işaretle; geri gelince işareti sil */
  const benYol = kok + '/o/' + UID;
  const hazirla = () => { DB.kopunca(benYol, { x: DB.now() }).catch(() => { }); DB.kopunca('masa/' + oyun + '/acik/' + kod, null).catch(() => { }); };
  hazirla(); nabiz = setInterval(() => { if (veri && veri.o && veri.o[UID] && veri.o[UID].x) { DB.update(benYol, { x: null }).catch(() => { }); hazirla(); } if (veri && veri.d === 0 && oda.yonetici()) dizin(veri); }, 12000);
  oda._dizin = () => dizin(veri);
  return oda;
}
async function kur(oyun, koltuk, acik, ad) {
  await baglan(); let kod = '';
  for (let d = 0; d < 6; d++) { kod = kodUret(); const r = await DB.tx(yol(oyun, kod), c => c ? undefined : { h: UID, t: DB.now(), d: 0, k: koltuk, a: acik ? 1 : 0, o: { [UID]: { n: ad, k: 0 } } }); if (r.ok) break; kod = ''; }
  if (!kod) throw new Error('Oda kurulamadı.');
  if (acik) await DB.set('masa/' + oyun + '/acik/' + kod, { t: DB.now(), u: UID, n: ad, b: koltuk - 1 }).catch(() => { });
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
  const aday = Object.entries(L).filter(([, v]) => v && v.b > 0 && v.u !== UID && simdi - v.t < 40000).sort((a, b) => b[1].t - a[1].t);
  for (const [kod] of aday) { try { return await katil(oyun, kod, ad); } catch (e) { } }
  return kur(oyun, koltuk, true, ad);
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
      <div class="ms-hata"></div><button class="ms-b" data-a="geri">‹ Geri</button>`;
    const m = new URLSearchParams(location.search).get('masa'); if (m && !lobi._kullanildi) { lobi._kullanildi = true; q('#ms-kodsat').hidden = false; q('#ms-kod').value = m.toUpperCase().slice(0, 5); if (adAl()) is('katil'); else hata('Adını yazıp Katıl’a bas.'); }
  }
  async function is(a) {
    const ad = adKoy(q('#ms-ad') ? q('#ms-ad').value : adAl()); if (!ad) { hata('Önce bir ad yaz.'); const i = q('#ms-ad'); if (i) i.focus(); return; }
    hata(''); el.querySelectorAll('button').forEach(b => b.disabled = true);
    try { oda = a === 'hizli' ? await hizli(o.oyun, o.koltuk, ad) : a === 'kur' ? await kur(o.oyun, o.koltuk, false, ad) : await katil(o.oyun, q('#ms-kod').value, ad); bekle(); }
    catch (e) { el.querySelectorAll('button').forEach(b => b.disabled = false); hata(/yüklenemedi|network|Failed/i.test(e.message || '') ? 'Sunucuya bağlanılamadı. İnternetini kontrol et.' : /PERMISSION|permission/i.test(e.message || e.code || '') ? 'Sunucu izin vermedi (kurallar güncel değil).' : (e.message || 'Bir şey ters gitti.')); }
  }
  function bekle() {
    birak = oda.dinle((v, h) => {
      if (bitti) return; if (!v) { hata('Oda kapandı.'); return giris(); }
      if (v.d >= 1 && v.g) { bitti = true; if (birak) birak(); return o.onOda(oda); }
      const K = oda.koltuklar(), n = K.filter(Boolean).length, yon = oda.yonetici(), link = location.origin + location.pathname + '?masa=' + oda.kod + '#o/' + o.oyun;
      el.innerHTML = `<h3>${v.a ? '⚡ Rakip aranıyor…' : '🔒 Özel oda'}</h3><div class="ms-kod">${oda.kod}</div>
        <p>${v.a ? 'Biri gelince oyun başlar. Kodu arkadaşına da verebilirsin.' : 'Bu kodu ya da bağlantıyı arkadaşına gönder.'}</p>
        <div class="ms-sat"><button class="ms-b" data-a="kopya">🔗 Bağlantıyı kopyala</button>${navigator.share ? '<button class="ms-b" data-a="paylas">📤 Paylaş</button>' : ''}</div>
        <div class="ms-o">${K.map((x, i) => x ? `<div>${x.uid === oda.uid ? '🟢' : '🔵'} ${esc(x.n)}${x.uid === oda.uid ? ' (sen)' : ''}<i>${i === 0 ? 'kurucu' : ''}</i></div>` : `<div class="bos">⚪ ${o.botlu ? 'boş (başlayınca bilgisayar oturur)' : 'bekleniyor…'}</div>`).join('')}</div>
        ${yon ? `<button class="ms-b ana" data-a="baslat" ${n >= o.enAz ? '' : 'disabled'}>${n >= o.koltuk ? 'Başlat' : o.botlu && n >= o.enAz ? 'Boş koltuklara bilgisayar otursun, başlat' : 'Oyuncu bekleniyor…'}</button>` : '<p style="text-align:center">Kurucunun başlatması bekleniyor…</p>'}
        <div class="ms-hata"></div><button class="ms-b" data-a="cik">‹ Odadan çık</button>`;
      el._link = link;
      if (yon && !o.botlu && n >= o.koltuk && !bekle._b) { bekle._b = true; setTimeout(() => { bekle._b = false; if (!bitti) o.baslat(oda); }, 700); }
    });
  }
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.a;
    if (a === 'geri') { kapat(); o.onGeri && o.onGeri(); } else if (a === 'kodla') { q('#ms-kodsat').hidden = false; q('#ms-kod').focus(); }
    else if (a === 'hizli' || a === 'kur' || a === 'katil') is(a);
    else if (a === 'kopya') { try { navigator.clipboard.writeText(el._link); b.textContent = '✓ Kopyalandı'; } catch (x) { hata(el._link); } }
    else if (a === 'paylas') navigator.share({ text: o.baslik + ' oynayalım mı? Kod: ' + oda.kod, url: el._link }).catch(() => { });
    else if (a === 'baslat') { b.disabled = true; o.baslat(oda); }
    else if (a === 'cik') { const x = oda; kapat(); if (x) x.ayril(); giris(); } });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ms-kod') is('katil'); e.stopPropagation(); });
  function kapat() { if (birak) birak(); birak = null; oda = null; }
  giris();
  return { kapat() { bitti = true; const x = oda; kapat(); return x; } };
}
window.Masa = { baglan, kur, katil, hizli, lobi, adAl, adKoy, get uid() { return UID; } };
})();
