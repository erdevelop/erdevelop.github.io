/* ═══════════════════════════════════════════════════════════════════════
   Proje Hattı · bulut (Supabase) — ekip paylaşımı
   - Giriş: e-posta bağlantısı ya da Google. Yalnızca davet edilenler.
   - Bulut projeleri satır satır eşitlenir (iş / bekleyen / not ayrı satır),
     böylece iki kişi aynı anda farklı işleri değiştirince çakışmaz.
   - Bağlantı yokken değişiklikler bu tarayıcıda kalır, bağlanınca gönderilir.
   - Giriş yapılmazsa uygulama eskisi gibi yalnızca bu tarayıcıda çalışır.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
const BULUT = {
  url: 'https://larjakwuvgjwsfzpfcwc.supabase.co',
  anahtar: 'sb_publishable_GXltFDN3_h_o0xpc16GXyg_icKnUK57'
};
const KUTUPHANE = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js',
  'https://unpkg.com/@supabase/supabase-js@2.58.0/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'
];
const TABAN_KEY = 'projeHatti.bulut';
const ROL_AD = { sahip: 'Sahip', duzenleyici: 'Düzenleyici', izleyici: 'İzleyici' };
const ALAN = { is: 'nodes', bekleyen: 'blockers', not: 'notes' };
const TURLER = Object.keys(ALAN);
const PARCA = 400;

let sb = null, kullanici = null, kanal = null;
let roller = {};   // proje id → rol
let sahipler = {}; // proje id → sahibin e-postası
let taban = {};    // proje id → { ad, meta, satir: { 'tur:id': kanonJSON } }  (sunucudaki son bilinen hal)
let durum = 'kapali', sonHata = '';
const yankilar = new Map(); // kendi gönderdiklerimiz, canlı yayından geri dönünce yok sayılır
let kayitSira = [];

/* ---------- yardımcılar ---------- */
const kanon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const salt = p => !!(p && p.bulut && roller[p.id] === 'izleyici');
const parcala = (l, n = PARCA) => { const o = []; for (let i = 0; i < l.length; i += n) o.push(l.slice(i, i + n)); return o; };
const adres = () => location.origin + location.pathname;
const kisaAd = e => String(e || '').split('@')[0];
const cevrimdisiMi = e => !navigator.onLine || /fetch|network|Failed to|Load failed|timeout/i.test(String(e && (e.message || e)));
function ayir(p) {
  const meta = {}; Object.keys(p).forEach(k => { if (!['id', 'name', 'nodes', 'blockers', 'notes', 'bulut'].includes(k)) meta[k] = p[k]; });
  const satir = {};
  TURLER.forEach(t => (p[ALAN[t]] || []).forEach(o => { satir[t + ':' + o.id] = kanon(o); }));
  return { ad: p.name, meta: kanon(meta), satir };
}
function tabandanProje(id, tb) {
  const p = { id, name: tb.ad, ...JSON.parse(tb.meta), nodes: [], blockers: [], notes: [], bulut: true };
  Object.entries(tb.satir).forEach(([k, j]) => p[ALAN[k.slice(0, k.indexOf(':'))]].push(JSON.parse(j)));
  return p;
}
function tabanKaydet() {
  try { localStorage.setItem(TABAN_KEY, JSON.stringify({ uid: kullanici ? kullanici.id : null, taban, roller, sahipler })); } catch (e) {}
}
function tabanOku() { try { return JSON.parse(localStorage.getItem(TABAN_KEY) || 'null'); } catch (e) { return null; } }
function yankiIsaretle(k, j) { const l = (yankilar.get(k) || []).filter(x => Date.now() - x.t < 30000); l.push({ j, t: Date.now() }); yankilar.set(k, l); }
function yankiMi(k, j) { const l = yankilar.get(k); return !!(l && l.some(x => x.j === j && Date.now() - x.t < 30000)); }
// yerel diske yaz; uzaktan gelen değişiklik geri alma adımı sayılmasın
function yerelYaz() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  sonDurum = durumMetni();
}
// uzaktan gelen bir değişikliği hem güncel veriye hem geri al / yinele yığınlarına uygula
// (yoksa geri al, ekip arkadaşının yaptığını da geri alırdı)
function heryereUygula(fn) {
  fn(S.projects);
  [geriYigin, ileriYigin].forEach(y => y.forEach(a => { try { const l = JSON.parse(a.d); fn(l); a.d = JSON.stringify(l); } catch (e) {} }));
  yerelYaz();
}
let cizBekliyor = false;
function guvenliCiz() {
  if (cizBekliyor) return; cizBekliyor = true;
  const dene = () => {
    const a = document.activeElement;
    const yaziyor = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#side, #viewport, #modal');
    if ((typeof tas !== 'undefined' && tas) || yaziyor) { setTimeout(dene, 700); return; }
    cizBekliyor = false; render(); if (typeof konsolCiz === 'function') konsolCiz();
  };
  requestAnimationFrame(dene);
}

/* ---------- durum göstergesi ---------- */
function durumYaz(d, hata) {
  durum = d; sonHata = hata ? String(hata.message || hata) : '';
  const b = document.getElementById('btnBulut'); if (!b) return;
  const isaret = { kapali: '', baglaniyor: ' …', tamam: ' ✓', gonderiyor: ' ↻', bekliyor: ' ⚠', hata: ' ⚠', yok: ' ✕' }[d] || '';
  b.textContent = kullanici ? '☁' + isaret : '☁ Giriş' + isaret;
  b.dataset.durum = d;
  b.title = !sb ? 'Bulut kütüphanesi yüklenemedi (internet bağlantısını kontrol et)'
    : !kullanici ? 'Ekibe giriş: projeleri paylaş ve birlikte çalış'
    : kullanici.email + ' · ' + ({ tamam: 'Eşitlendi', gonderiyor: 'Gönderiliyor…', bekliyor: 'Bağlantı yok: değişiklikler bu tarayıcıda bekliyor, bağlanınca gönderilecek', hata: 'Eşitleme hatası: ' + sonHata, baglaniyor: 'Bağlanıyor…' }[d] || '');
}

/* ---------- gönderme (yerel → bulut) ---------- */
let zamanlayici = null, aktif = null, tekrar = false, yazimSayac = 0;
function planla(ms = 400) { clearTimeout(zamanlayici); zamanlayici = setTimeout(gonder, ms); }
function gonder() {
  if (!sb || !kullanici) return Promise.resolve();
  if (aktif) { tekrar = true; return aktif; }
  aktif = (async () => {
    let hata = null;
    try {
      // bu tarayıcıda kaldırılan bulut projeleri
      for (const pid of Object.keys(taban)) if (!S.projects.some(p => p.id === pid && p.bulut)) await projeKaldir(pid);
      for (const p of S.projects.filter(p => p.bulut)) {
        if (!taban[p.id]) { durumYaz('gonderiyor'); await projeYukle(p); }
        if (salt(p)) continue;
        await projeGonder(p);
      }
      await kayitlariGonder();
    } catch (e) { hata = e; }
    tabanKaydet();
    if (hata) { console.warn('[bulut]', hata); durumYaz(cevrimdisiMi(hata) ? 'bekliyor' : 'hata', hata); planla(15000); }
    else durumYaz('tamam');
  })().finally(() => { aktif = null; if (tekrar) { tekrar = false; planla(50); } });
  return aktif;
}
const hatayiAt = r => { if (r && r.error) throw r.error; return r; };
async function projeYukle(p) {
  let r = await sb.from('projeler').insert({ id: p.id, ad: p.name, meta: JSON.parse(ayir(p).meta), sahip: kullanici.id });
  if (r.error && r.error.code === '23505') { // bu kimlik başka bir projede kullanılıyor: yeni kimlik
    const eski = p.id; p.id = uid(); if (S.activeId === eski) S.activeId = p.id;
    r = await sb.from('projeler').insert({ id: p.id, ad: p.name, meta: JSON.parse(ayir(p).meta), sahip: kullanici.id });
  }
  hatayiAt(r);
  const a = ayir(p);
  taban[p.id] = { ad: a.ad, meta: a.meta, satir: {} }; roller[p.id] = 'sahip';
  yankiIsaretle('p:' + p.id, kanon({ ad: a.ad, meta: JSON.parse(a.meta) }));
  yerelYaz(); tabanKaydet();
}
async function projeGonder(p) {
  const yeni = ayir(p), eski = taban[p.id]; if (!eski) return;
  if (yeni.ad !== eski.ad || yeni.meta !== eski.meta) {
    durumYaz('gonderiyor');
    const meta = JSON.parse(yeni.meta);
    yankiIsaretle('p:' + p.id, kanon({ ad: yeni.ad, meta }));
    yazimSayac++;
    hatayiAt(await sb.from('projeler').update({ ad: yeni.ad, meta }).eq('id', p.id));
    eski.ad = yeni.ad; eski.meta = yeni.meta;
  }
  const ekle = Object.keys(yeni.satir).filter(k => eski.satir[k] !== yeni.satir[k]);
  const sil = {}; Object.keys(eski.satir).filter(k => !(k in yeni.satir)).forEach(k => { const t = k.slice(0, k.indexOf(':')); (sil[t] = sil[t] || []).push(k); });
  if (ekle.length || Object.keys(sil).length) durumYaz('gonderiyor');
  for (const grup of parcala(ekle)) {
    grup.forEach(k => yankiIsaretle(p.id + '|' + k, yeni.satir[k]));
    yazimSayac++;
    hatayiAt(await sb.from('ogeler').upsert(grup.map(k => { const i = k.indexOf(':'); return { proje_id: p.id, tur: k.slice(0, i), id: k.slice(i + 1), veri: JSON.parse(yeni.satir[k]) }; })));
    grup.forEach(k => { eski.satir[k] = yeni.satir[k]; });
  }
  for (const [t, ks] of Object.entries(sil)) for (const grup of parcala(ks, 150)) {
    yazimSayac++;
    hatayiAt(await sb.from('ogeler').delete().eq('proje_id', p.id).eq('tur', t).in('id', grup.map(k => k.slice(t.length + 1))));
    grup.forEach(k => { delete eski.satir[k]; });
  }
}
async function projeKaldir(pid) {
  if (roller[pid] === 'sahip') hatayiAt(await sb.from('projeler').delete().eq('id', pid));
  else if (roller[pid]) hatayiAt(await sb.from('uyeler').delete().eq('proje_id', pid).eq('kullanici', kullanici.id));
  delete taban[pid]; delete roller[pid];
}
async function kayitlariGonder() {
  const l = kayitSira.filter(k => taban[k.proje_id] && !salt({ id: k.proje_id, bulut: true })); if (!l.length) return;
  hatayiAt(await sb.from('kayitlar').insert(l.map(k => ({ proje_id: k.proje_id, mesaj: k.mesaj, is_id: k.is_id, tur: 'islem', kullanici: kullanici.id, eposta: kullanici.email }))));
  kayitSira = kayitSira.filter(k => !l.includes(k));
}

/* ---------- çekme (bulut → yerel) ---------- */
let cekiliyor = null, olayTampon = null; // çekme sürerken gelen canlı olaylar sonra uygulanır
const tamponla = f => pl => { if (olayTampon) olayTampon.push([f, pl]); else f(pl); };
function cek() { if (!cekiliyor) cekiliyor = cekAsil().finally(() => cekiliyor = null); return cekiliyor; }
async function sunucudanOku() {
  const uy = hatayiAt(await sb.from('uyeler').select('proje_id,rol').eq('kullanici', kullanici.id)).data || [];
  roller = {}; uy.forEach(u => roller[u.proje_id] = u.rol);
  const ids = Object.keys(roller), gelen = {};
  for (const g of parcala(ids, 100)) {
    (hatayiAt(await sb.from('uyeler').select('proje_id,eposta').in('proje_id', g).eq('rol', 'sahip')).data || []).forEach(r => { sahipler[r.proje_id] = r.eposta; });
    (hatayiAt(await sb.from('projeler').select('id,ad,meta').in('id', g)).data || []).forEach(r => {
      gelen[r.id] = { ad: r.ad, meta: kanon(r.meta || {}), satir: {} };
    });
    for (let i = 0; ; i += 1000) {
      const d = hatayiAt(await sb.from('ogeler').select('proje_id,tur,id,veri').in('proje_id', g).order('proje_id').order('tur').order('id').range(i, i + 999)).data || [];
      d.forEach(r => { if (gelen[r.proje_id]) gelen[r.proje_id].satir[r.tur + ':' + r.id] = kanon(r.veri); });
      if (d.length < 1000) break;
    }
  }
  return gelen;
}
async function cekAsil() {
  if (!sb || !kullanici) return;
  durumYaz('baglaniyor');
  olayTampon = [];
  try {
    let gelen, deneme = 0;
    do { // çekme sürerken kendi değişikliğimiz gönderildiyse sonuç eskimiş olabilir: yeniden çek
      await gonder(); // önce bekleyen yerel değişiklikler
      const s0 = yazimSayac;
      gelen = await sunucudanOku();
      if (yazimSayac === s0 && !aktif) break;
    } while (++deneme < 4);
    const oncekiler = new Set(S.projects.filter(p => p.bulut).map(p => p.id));
    // erişimi kalmayan bulut projeleri: yerel kopya olarak kalsın
    S.projects.filter(p => p.bulut && taban[p.id] && !gelen[p.id]).forEach(p => {
      delete p.bulut; delete taban[p.id];
      toast(`“${p.name}” projesine erişimin kalmadı; bu tarayıcıda yerel kopya olarak tutuldu`);
    });
    Object.entries(gelen).forEach(([id, tb]) => {
      const yeni = tabandanProje(id, tb), i = S.projects.findIndex(p => p.id === id);
      if (i >= 0) {
        // bu arada yerelde yapılıp henüz gönderilemeyen değişiklik varsa koru (gönderilecek)
        const yerel = S.projects[i], eskiTb = taban[id];
        if (eskiTb && yerel.bulut) {
          const y = ayir(yerel);
          if (y.ad !== eskiTb.ad) yeni.name = yerel.name;
          if (y.meta !== eskiTb.meta) Object.assign(yeni, JSON.parse(y.meta));
          // yerelde silinmiş olanlar
          Object.keys(eskiTb.satir).forEach(k => { if (k in y.satir) return; const t = k.slice(0, k.indexOf(':')); yeni[ALAN[t]] = yeni[ALAN[t]].filter(o => t + ':' + o.id !== k); });
          // yerelde eklenmiş / değişmiş olanlar
          Object.entries(y.satir).forEach(([k, j]) => { if (eskiTb.satir[k] === j) return; const t = k.slice(0, k.indexOf(':')), l = yeni[ALAN[t]], o = JSON.parse(j), x = l.findIndex(q => q.id === o.id); if (x >= 0) l[x] = o; else l.push(o); });
        }
        S.projects[i] = yeni;
      } else S.projects.push(yeni);
      taban[id] = tb;
    });
    // kayıtların sırası: işler order alanına göre çiziliyor, dizi sırası önemsiz
    S.projects.forEach(p => { if (p.bulut && typeof etiketTamamla === 'function') etiketTamamla(p); });
    if (!S.projects.some(p => p.id === S.activeId)) S.activeId = S.projects[0] && S.projects[0].id;
    // seninle yeni paylaşılan proje varsa ona geç
    const yeniPay = Object.keys(gelen).filter(id => !oncekiler.has(id) && roller[id] !== 'sahip');
    if (yeniPay.length) {
      const yp = S.projects.find(p => p.id === yeniPay[0]);
      S.activeId = yp.id; ui.sel = null; ui.parsiyel = '*'; ui.etiket = '*';
      toast(`“${yp.name}” projesi seninle paylaşıldı (sahibi: ${kisaAd(sahipler[yp.id]) || '?'})` + (yeniPay.length > 1 ? ` · ${yeniPay.length - 1} proje daha` : ''));
    }
    geriYigin = []; ileriYigin = []; gecmisDugmeleri();
    yerelYaz(); tabanKaydet();
    guvenliCiz();
    durumYaz('tamam');
    planla(50); // korunan yerel değişiklikler varsa gönder
  } catch (e) {
    console.warn('[bulut] çekme', e);
    durumYaz(cevrimdisiMi(e) ? 'bekliyor' : 'hata', e);
  }
  const l = olayTampon || []; olayTampon = null;
  l.forEach(([f, pl]) => { try { f(pl); } catch (e) { console.warn('[bulut] olay', e); } });
}

/* ---------- canlı güncelleme ---------- */
function kanalKur() {
  if (kanal) { sb.removeChannel(kanal); kanal = null; }
  kanal = sb.channel('proje-hatti')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ogeler' }, tamponla(uzakOge))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projeler' }, tamponla(uzakProje))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kayitlar' }, uzakKayit)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'uyeler' }, () => { clearTimeout(kanal._c); kanal._c = setTimeout(cek, 600); })
    .subscribe(st => { if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') durumYaz('bekliyor', 'Canlı bağlantı koptu'); else if (st === 'SUBSCRIBED' && durum === 'bekliyor') cek(); });
}
function uzakOge(pl) {
  const sil = pl.eventType === 'DELETE', r = sil ? pl.old : pl.new;
  if (!r || !r.proje_id || !ALAN[r.tur]) return;
  const pid = r.proje_id, tb = taban[pid], p = S.projects.find(x => x.id === pid && x.bulut);
  if (!tb || !p) return;
  const k = r.tur + ':' + r.id, alan = ALAN[r.tur];
  const yerelO = (p[alan] || []).find(o => o.id === r.id), yerelJ = yerelO ? kanon(yerelO) : undefined;
  const bekleyenYerel = yerelJ !== tb.satir[k]; // henüz gönderilmemiş yerel değişiklik
  if (sil) {
    delete tb.satir[k];
    if (bekleyenYerel || !yerelO) return;
    heryereUygula(l => { const q = l.find(x => x.id === pid); if (q && q[alan]) q[alan] = q[alan].filter(o => o.id !== r.id); });
  } else {
    const j = kanon(r.veri);
    if ((!r.guncelleyen || r.guncelleyen === kullanici.id) && yankiMi(pid + '|' + k, j)) { if (!bekleyenYerel || yerelJ === j) tb.satir[k] = j; return; }
    tb.satir[k] = j;
    if (bekleyenYerel || yerelJ === j) return;
    heryereUygula(l => { const q = l.find(x => x.id === pid); if (!q) return; q[alan] = q[alan] || []; const i = q[alan].findIndex(o => o.id === r.id); const o = JSON.parse(j); if (i >= 0) q[alan][i] = o; else q[alan].push(o); });
  }
  tabanKaydet(); if (pid === S.activeId) guvenliCiz();
}
function uzakProje(pl) {
  if (pl.eventType === 'DELETE') {
    const pid = pl.old && pl.old.id, p = S.projects.find(x => x.id === pid && x.bulut);
    if (!p || !taban[pid]) return;
    delete taban[pid]; delete roller[pid];
    S.projects = S.projects.filter(x => x !== p);
    if (!S.projects.length) S.projects.push(yeniProje('Yeni proje', ['A']));
    if (S.activeId === pid) { S.activeId = S.projects[0].id; ui.sel = null; }
    geriYigin = []; ileriYigin = []; gecmisDugmeleri();
    yerelYaz(); tabanKaydet(); toast(`“${p.name}” projesi sahibi tarafından silindi`); guvenliCiz();
    return;
  }
  const r = pl.new; if (!r) return;
  const tb = taban[r.id], p = S.projects.find(x => x.id === r.id && x.bulut);
  if (!tb || !p) { if (pl.eventType === 'INSERT') { clearTimeout(kanal._c); kanal._c = setTimeout(cek, 600); } return; }
  const meta = kanon(r.meta || {});
  if ((!r.guncelleyen || r.guncelleyen === kullanici.id) && yankiMi('p:' + r.id, kanon({ ad: r.ad, meta: r.meta || {} }))) return;
  const y = ayir(p), bekleyen = y.ad !== tb.ad || y.meta !== tb.meta;
  tb.ad = r.ad; tb.meta = meta;
  if (bekleyen) return;
  heryereUygula(l => { const q = l.find(x => x.id === r.id); if (!q) return;
    Object.keys(q).forEach(k => { if (!['id', 'name', 'nodes', 'blockers', 'notes', 'bulut'].includes(k)) delete q[k]; });
    Object.assign(q, JSON.parse(meta)); q.name = r.ad; });
  tabanKaydet(); if (r.id === S.activeId) guvenliCiz();
}
function uzakKayit(pl) {
  const r = pl.new; if (!r || r.kullanici === kullanici.id || !S.projects.some(p => p.id === r.proje_id)) return;
  const k = { t: Date.parse(r.zaman) || Date.now(), m: `${kisaAd(r.eposta)} · ${r.mesaj}`, tur: 'uzak', id: r.is_id || null, p: r.proje_id };
  kayit.push(k); if (kayit.length > KAYIT_SINIR) kayit = kayit.slice(-KAYIT_SINIR);
  kayitKaydet(); konsolSatir(k);
}

/* ---------- oturum ---------- */
async function oturumDegisti(ses) {
  const u = ses && ses.user || null;
  if ((u && u.id) === (kullanici && kullanici.id)) { durumYaz(u ? (durum === 'baglaniyor' ? 'tamam' : durum) : 'kapali'); return; }
  if (kullanici && !u) { kullanici = null; cikisTemizle(); }
  kullanici = u;
  if (!u) { durumYaz('kapali'); render(); return; }
  const kayitli = tabanOku();
  if (kayitli && kayitli.uid === u.id) { taban = kayitli.taban || {}; roller = kayitli.roller || {}; sahipler = kayitli.sahipler || {}; }
  else {
    // bu tarayıcıda önceki başka bir hesabın bulut projeleri kaldıysa temizle
    if (kayitli && kayitli.taban) S.projects = S.projects.filter(p => !(p.bulut && kayitli.taban[p.id]));
    taban = {}; roller = {}; sahipler = {};
  }
  durumYaz('baglaniyor');
  try { const r = await sb.rpc('davetleri_kabul_et'); if (r.data > 0) toast(`${r.data} yeni projeye katıldın`); } catch (e) {}
  kanalKur();
  await cek();
  log(`☁ Giriş yapıldı: ${u.email}`, 'bilgi');
}
function cikisTemizle() {
  if (kanal) { sb.removeChannel(kanal); kanal = null; }
  S.projects = S.projects.filter(p => !p.bulut);
  if (!S.projects.length) S.projects.push(yeniProje('Yeni proje', ['A']));
  if (!S.projects.some(p => p.id === S.activeId)) { S.activeId = S.projects[0].id; ui.sel = null; }
  taban = {}; roller = {}; sahipler = {}; kayitSira = [];
  try { localStorage.removeItem(TABAN_KEY); } catch (e) {}
  geriYigin = []; ileriYigin = []; gecmisDugmeleri();
  yerelYaz(); render(); konsolCiz();
}
function urlHatasi() {
  const q = new URLSearchParams(location.hash.slice(1) + '&' + location.search.slice(1));
  const h = q.get('error_description') || q.get('error');
  if (!h) return;
  history.replaceState(null, '', adres());
  const m = /database error saving new user|signups? not allowed|davetli/i.test(h) ? 'Bu e-posta davet edilmemiş. Proje sahibinden davet iste.'
    : /expired|invalid/i.test(h) ? 'Giriş bağlantısının süresi dolmuş ya da daha önce kullanılmış. Yeni bağlantı iste.' : 'Giriş yapılamadı: ' + h;
  setTimeout(() => { toast(m); girisModal(m); }, 300);
}
function kutuphaneYukle() {
  if (window.supabase && window.supabase.createClient) return Promise.resolve();
  return KUTUPHANE.reduce((on, src) => on.catch(() => new Promise((ok, red) => {
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = () => window.supabase && window.supabase.createClient ? ok() : red(new Error('boş'));
    s.onerror = () => { s.remove(); red(new Error('yüklenemedi: ' + src)); };
    document.head.appendChild(s);
  })), Promise.reject());
}
async function baslat() {
  arayuzKur();
  durumYaz('baglaniyor');
  try { await kutuphaneYukle(); }
  catch (e) { sb = null; durumYaz('yok'); return; }
  sb = window.supabase.createClient(BULUT.url, BULUT.anahtar, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'projeHatti.oturum' } });
  urlHatasi();
  sb.auth.onAuthStateChange((ev, ses) => setTimeout(() => oturumDegisti(ses), 0));
  const { data } = await sb.auth.getSession();
  await oturumDegisti(data && data.session);
}

/* ---------- uygulamaya bağlantılar ---------- */
const asilSave = save;
save = function () {
  asilSave();
  if (!kullanici) return;
  // izleyici bir şey değiştirdiyse (komut, sürükleme vb.) buluttaki hale dön
  S.projects.forEach((p, i) => {
    if (!salt(p) || !taban[p.id]) return;
    const a = ayir(p), tb = taban[p.id];
    if (a.ad === tb.ad && a.meta === tb.meta && kanon(a.satir) === kanon(tb.satir)) return;
    S.projects[i] = tabandanProje(p.id, tb); geriYigin.pop(); gecmisDugmeleri(); yerelYaz();
    const son = kayit[kayit.length - 1]; if (son && son.tur === 'islem' && Date.now() - son.t < 2000) { kayit.pop(); kayitKaydet(); konsolCiz(); }
    toast('Bu projede yalnızca görüntüleme yetkin var');
  });
  planla();
};
const asilDegis = degis;
degis = function (fn, mesaj) {
  if (salt(P())) { toast('Bu projede yalnızca görüntüleme yetkin var'); return; }
  return asilDegis(fn, mesaj);
};
const asilGecmis = gecmisUygula;
gecmisUygula = function (kaynak, hedef, ad) {
  if (salt(P())) { toast('Bu projede yalnızca görüntüleme yetkin var'); return; }
  asilGecmis(kaynak, hedef, ad); if (kullanici) planla();
};
const asilLog = log;
log = function (m, tur = 'bilgi', id = null) {
  asilLog(m, tur, id);
  if (tur === 'islem' && kullanici && P() && P().bulut && !salt(P())) kayitSira.push({ proje_id: P().id, mesaj: String(m).replace(/^[↶↷]\s*/, ''), is_id: id });
};
const asilYeniProje = yeniProje;
yeniProje = function (...a) { const p = asilYeniProje(...a); if (kullanici && sb) p.bulut = true; return p; };
const asilProjeler = renderProjeler;
renderProjeler = function () {
  asilProjeler();
  [...document.querySelectorAll('#projSel option')].forEach(o => { const p = S.projects.find(x => x.id === o.value); if (p && p.bulut) o.textContent = '☁ ' + o.textContent + (roller[p.id] && roller[p.id] !== 'sahip' && sahipler[p.id] ? ' · ' + kisaAd(sahipler[p.id]) : ''); });
  const r = document.getElementById('bulutRozet'); if (!r) return;
  const p = P();
  if (!kullanici) { r.hidden = true; return; }
  r.hidden = false;
  r.className = 'bulut-rozet' + (p.bulut ? ' paylasilan' : '') + (salt(p) ? ' salt' : '');
  r.textContent = !p.bulut ? 'Yalnızca bu tarayıcıda · Paylaş' : salt(p) ? '👁 İzleyici' : (roller[p.id] === 'sahip' ? 'Paylaş' : '☁ ' + (ROL_AD[roller[p.id]] || 'Ekip'));
  r.title = !p.bulut ? 'Bu proje yalnızca bu tarayıcıda. Tıkla: buluta taşı ve ekibinle paylaş'
    : (salt(p) ? 'Bu projede yalnızca görüntüleme yetkin var' : 'Üyeler ve davetler') + (sahipler[p.id] ? ' · sahibi: ' + sahipler[p.id] : '');
};

/* ---------- arayüz ---------- */
function arayuzKur() {
  const io = document.querySelector('header .io');
  if (io && !document.getElementById('btnBulut')) io.insertAdjacentHTML('afterbegin', '<button id="btnBulut" class="btn ghost bulut-btn" data-durum="kapali">☁ Giriş</button>');
  const pr = document.querySelector('header .proj');
  if (pr && !document.getElementById('bulutRozet')) pr.insertAdjacentHTML('beforeend', '<button id="bulutRozet" class="bulut-rozet" hidden></button>');
  document.getElementById('btnBulut').onclick = () => kullanici ? hesapModal() : girisModal();
  document.getElementById('bulutRozet').onclick = () => paylasModal();
  renderProjeler();
}
function girisModal(mesaj) {
  if (!sb) { toast('Bulut kütüphanesi yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.'); return; }
  modal(`<h3>Ekibe giriş</h3>
    <p class="small">Yalnızca davet edilen e-postalar girebilir. Giriş yapmadan da her şey bu tarayıcıda çalışmaya devam eder.</p>
    ${mesaj ? `<p class="bulut-uyari">${esc(mesaj)}</p>` : ''}
    <button class="btn primary bulut-google" id="gGoogle"><b>G</b> Google ile giriş</button>
    <div class="bulut-ayrac"><span>ya da e-postana giriş bağlantısı gelsin</span></div>
    <div class="row"><input type="email" id="gEposta" placeholder="ad@ornek.com" style="flex:1" autocomplete="email"><button class="btn" id="gGonder">Bağlantı gönder</button></div>
    <p class="small" id="gDurum"></p>
    <div class="acts"><button class="btn" data-close>Kapat</button></div>`, m => {
    const d = m.querySelector('#gDurum');
    m.querySelector('#gGoogle').onclick = async () => {
      d.textContent = 'Google’a yönlendiriliyor…';
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: adres() } });
      if (error) d.textContent = 'Olmadı: ' + error.message;
    };
    const gonderBag = async () => {
      const e = m.querySelector('#gEposta').value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(e)) { d.textContent = 'Geçerli bir e-posta yaz.'; return; }
      d.textContent = 'Gönderiliyor…';
      const { error } = await sb.auth.signInWithOtp({ email: e, options: { emailRedirectTo: adres(), shouldCreateUser: true } });
      if (!error) { d.innerHTML = `<b>${esc(e)}</b> adresine giriş bağlantısı gönderildi. E-postadaki bağlantıya tıkla; bu sayfa açılınca giriş yapılmış olur. (Gelmezse istenmeyen klasörüne bak.)`; return; }
      const em = String(error.message || error);
      d.textContent = /database error|not allowed|davetli/i.test(em) ? 'Bu e-posta davet edilmemiş. Proje sahibinden davet iste.'
        : /rate|too many|seconds/i.test(em) ? 'Çok sık istendi. Birkaç dakika sonra yeniden dene.' : 'Olmadı: ' + em;
    };
    m.querySelector('#gGonder').onclick = gonderBag;
    m.querySelector('#gEposta').onkeydown = e => { if (e.key === 'Enter') gonderBag(); };
  });
}
function hesapModal() {
  const say = S.projects.filter(p => p.bulut).length;
  modal(`<h3>Hesap</h3>
    <p><b>${esc(kullanici.email)}</b></p>
    <p class="small">${say} bulut projesi · durum: ${esc(document.getElementById('btnBulut').title)}</p>
    <div class="acts" style="justify-content:flex-start;flex-wrap:wrap">
      <button class="btn primary" id="hPaylas">Bu projeyi paylaş / üyeler</button>
      <button class="btn" id="hEsitle">Şimdi eşitle</button>
      <button class="btn danger" id="hCikis" style="margin-left:auto">Çıkış yap</button>
      <button class="btn" data-close>Kapat</button></div>`, m => {
    m.querySelector('#hPaylas').onclick = () => paylasModal();
    m.querySelector('#hEsitle').onclick = async () => { modalKapat(); await cek(); toast(durum === 'tamam' ? 'Eşitlendi' : 'Eşitlenemedi: ' + sonHata); };
    m.querySelector('#hCikis').onclick = async () => {
      if (durum === 'bekliyor' || durum === 'hata') { if (!confirm('Henüz buluta gönderilemeyen değişiklikler var. Çıkış yaparsan bu tarayıcıdan silinecek. Yine de çıkılsın mı?')) return; }
      modalKapat(); await sb.auth.signOut(); toast('Çıkış yapıldı');
    };
  });
}
async function paylasModal() {
  if (!sb) { toast('Bulut kütüphanesi yüklenemedi.'); return; }
  if (!kullanici) { girisModal(); return; }
  const p = P();
  if (!p.bulut) {
    modal(`<h3>Paylaş: ${esc(p.name)}</h3>
      <p>Bu proje şu an yalnızca bu tarayıcıda duruyor.</p>
      <p class="small">Buluta taşıyınca her yerden açabilirsin ve davet ettiğin kişiler de görür. Davet etmediğin kimse göremez.</p>
      <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="pYukle">☁ Buluta taşı</button></div>`, m => {
      m.querySelector('#pYukle').onclick = async () => {
        m.querySelector('#pYukle').disabled = true; m.querySelector('#pYukle').textContent = 'Taşınıyor…';
        p.bulut = true; sonMesaj = 'Buluta taşındı: ' + p.name; save();
        await gonder();
        if (taban[p.id]) { render(); paylasModal(); }
        else { delete p.bulut; yerelYaz(); render(); modalKapat(); toast('Taşınamadı: ' + sonHata); }
      };
    });
    return;
  }
  const rol = roller[p.id], sahip = rol === 'sahip';
  modal(`<h3>Paylaş: ${esc(p.name)}</h3><p class="small">Yükleniyor…</p>`);
  const [u, d] = await Promise.all([
    sb.from('uyeler').select('kullanici,rol,eposta').eq('proje_id', p.id),
    sahip ? sb.from('davetler').select('id,eposta,rol').eq('proje_id', p.id) : Promise.resolve({ data: [] })
  ]);
  if (u.error) { modal(`<h3>Paylaş</h3><p>Üyeler okunamadı: ${esc(u.error.message)}</p><div class="acts"><button class="btn" data-close>Kapat</button></div>`); return; }
  const uyeler = (u.data || []).sort((a, b) => (a.rol !== 'sahip') - (b.rol !== 'sahip') || String(a.eposta).localeCompare(b.eposta));
  const davetler = d.data || [];
  const rolSec = (x, ad) => `<select data-${ad}="${esc(x.kullanici || x.id)}">${['duzenleyici', 'izleyici'].map(r => `<option value="${r}" ${x.rol === r ? 'selected' : ''}>${ROL_AD[r]}</option>`).join('')}</select>`;
  const bag = adres();
  modal(`<h3>Paylaş: ${esc(p.name)}</h3>
    <p class="small">Senin rolün: <b>${ROL_AD[rol] || '—'}</b>. Düzenleyici her şeyi değiştirebilir, izleyici yalnızca görür.</p>
    <label>Üyeler</label>
    <div class="bulut-liste">${uyeler.map(x => `<div class="bulut-satir"><span class="grow">${esc(x.eposta || x.kullanici)}${x.kullanici === kullanici.id ? ' <span class="small">(sen)</span>' : ''}</span>
      ${x.rol === 'sahip' ? '<span class="small">Sahip</span>' : sahip ? rolSec(x, 'urol') + `<button class="btn sm ghost" data-devret="${esc(x.kullanici)}" title="Sahipliği bu kişiye devret">Sahip yap</button><button class="btn sm ghost" data-cikar="${esc(x.kullanici)}" title="Projeden çıkar">✕</button>` : `<span class="small">${ROL_AD[x.rol]}</span>`}</div>`).join('')}</div>
    ${sahip ? `<label>Bekleyen davetler</label>
    <div class="bulut-liste">${davetler.map(x => `<div class="bulut-satir"><span class="grow">${esc(x.eposta)}</span>${rolSec(x, 'drol')}<button class="btn sm ghost" data-dsil="${esc(x.id)}" title="Daveti iptal et">✕</button></div>`).join('') || '<div class="small">Yok.</div>'}</div>
    <label>Davet et</label>
    <div class="row"><input type="email" id="dEposta" placeholder="ekip@ornek.com" style="flex:1"><select id="dRol"><option value="duzenleyici">Düzenleyici</option><option value="izleyici">İzleyici</option></select><button class="btn primary" id="dOk">Davet et</button></div>
    <p class="small" id="dDurum">Davet edilen kişi <b>${esc(bag)}</b> adresine girip aynı e-postayla (Google ya da e-posta bağlantısı) giriş yapınca projeyi görür. Davet e-postası otomatik gitmez; bağlantıyı ona sen ilet.</p>` : ''}
    <div class="acts">${!sahip ? '<button class="btn danger" id="pAyril" style="margin-right:auto">Projeden ayrıl</button>' : ''}<button class="btn" data-close>Kapat</button></div>`, m => {
    $('#modal').classList.add('genis');
    const yenile = () => paylasModal();
    const dene = async (is, tamam) => { const r = await is; if (r.error) toast('Olmadı: ' + r.error.message); else { if (tamam) toast(tamam); yenile(); } };
    m.querySelectorAll('[data-urol]').forEach(s => s.onchange = () => dene(sb.from('uyeler').update({ rol: s.value }).eq('proje_id', p.id).eq('kullanici', s.dataset.urol), 'Rol değişti'));
    m.querySelectorAll('[data-drol]').forEach(s => s.onchange = () => dene(sb.from('davetler').update({ rol: s.value }).eq('id', s.dataset.drol), 'Davet rolü değişti'));
    m.querySelectorAll('[data-cikar]').forEach(b => b.onclick = () => { if (confirm('Bu kişi projeden çıkarılsın mı?')) dene(sb.from('uyeler').delete().eq('proje_id', p.id).eq('kullanici', b.dataset.cikar), 'Projeden çıkarıldı'); });
    m.querySelectorAll('[data-dsil]').forEach(b => b.onclick = () => dene(sb.from('davetler').delete().eq('id', b.dataset.dsil), 'Davet iptal edildi'));
    m.querySelectorAll('[data-devret]').forEach(b => b.onclick = async () => {
      if (!confirm('Sahiplik bu kişiye geçsin mi? Sen düzenleyici olursun.')) return;
      const r = await sb.rpc('sahipligi_devret', { p: p.id, yeni: b.dataset.devret });
      if (r.error) toast('Olmadı: ' + r.error.message); else { roller[p.id] = 'duzenleyici'; tabanKaydet(); toast('Sahiplik devredildi'); render(); yenile(); }
    });
    const ok = m.querySelector('#dOk');
    if (ok) {
      const davet = async () => {
        const e = m.querySelector('#dEposta').value.trim().toLowerCase(), r = m.querySelector('#dRol').value;
        if (!/^\S+@\S+\.\S+$/.test(e)) { toast('Geçerli bir e-posta yaz'); return; }
        if (uyeler.some(x => String(x.eposta).toLowerCase() === e)) { toast('Bu kişi zaten üye'); return; }
        const res = await sb.from('davetler').upsert({ proje_id: p.id, eposta: e, rol: r }, { onConflict: 'proje_id,eposta' });
        if (res.error) { toast('Olmadı: ' + res.error.message); return; }
        log(`☁ Davet edildi: ${e} (${ROL_AD[r]})`, 'bilgi');
        await paylasModal();
        const dd = document.getElementById('dDurum');
        if (dd) dd.innerHTML = `<b>${esc(e)}</b> davet edildi. Şimdi ona siteyi gönder: <a href="mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent('Proje Hattı daveti: ' + p.name)}&body=${encodeURIComponent(`Merhaba,\n\n"${p.name}" projesine seni ekledim. Bu adresten ${e} ile (Google ya da e-posta bağlantısı) giriş yapınca görürsün:\n${bag}\n`)}">e-postayla gönder</a> · <a href="#" id="dKopya">bağlantıyı kopyala</a>`;
        const kp = document.getElementById('dKopya'); if (kp) kp.onclick = ev => { ev.preventDefault(); navigator.clipboard && navigator.clipboard.writeText(bag); toast('Bağlantı kopyalandı'); };
      };
      ok.onclick = davet;
      m.querySelector('#dEposta').onkeydown = e => { if (e.key === 'Enter') davet(); };
    }
    const ay = m.querySelector('#pAyril');
    if (ay) ay.onclick = async () => {
      if (!confirm(`"${p.name}" projesinden ayrılınca artık göremezsin. Ayrılınsın mı?`)) return;
      const r = await sb.from('uyeler').delete().eq('proje_id', p.id).eq('kullanici', kullanici.id);
      if (r.error) { toast('Olmadı: ' + r.error.message); return; }
      delete taban[p.id]; delete roller[p.id]; tabanKaydet();
      S.projects = S.projects.filter(x => x !== p);
      if (!S.projects.length) S.projects.push(yeniProje('Yeni proje', ['A']));
      S.activeId = S.projects[0].id; ui.sel = null; geriYigin = []; ileriYigin = []; gecmisDugmeleri();
      yerelYaz(); modalKapat(); render(); toast('Projeden ayrıldın');
    };
  });
}

/* ---------- komut satırı ---------- */
(function () {
  const onceki = window.KOMUT_EK;
  window.KOMUT_EK = function (k, arg, sel) {
    if (k === 'giris' || k === 'giriş') { kullanici ? hesapModal() : girisModal(); return true; }
    if (k === 'cikis' || k === 'çıkış') { if (kullanici) sb.auth.signOut(); else toast('Giriş yapılmamış'); return true; }
    if (k === 'paylas' || k === 'paylaş' || k === 'davet') { paylasModal(); return true; }
    if (k === 'esitle' || k === 'eşitle') { if (kullanici) cek().then(() => toast(durum === 'tamam' ? 'Eşitlendi' : 'Eşitlenemedi: ' + sonHata)); else toast('Önce giriş yap'); return true; }
    return onceki ? onceki(k, arg, sel) : false;
  };
})();
if (typeof KOMUTLAR !== 'undefined') KOMUTLAR.splice(KOMUTLAR.length - 1, 0, ['paylaş', 'Projeyi buluta taşır, üyeleri ve davetleri yönetir'], ['giriş · çıkış · eşitle', 'Ekip hesabı']);

/* ---------- arka plan ---------- */
let gizlendi = 0;
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) { gizlendi = Date.now(); return; }
  if (!kullanici || !sb) return;
  try { const r = await sb.rpc('davetleri_kabul_et'); if (r.data > 0) { toast(`${r.data} yeni projeye katıldın`); return cek(); } } catch (e) {}
  if (Date.now() - gizlendi > 60000 || durum !== 'tamam') cek(); // uzun ara: kaçan değişiklikleri al
});
window.addEventListener('online', () => { if (kullanici) cek(); });
window.addEventListener('offline', () => { if (kullanici) durumYaz('bekliyor', 'Bağlantı yok'); });

window.bulut = { cek, gonder, paylasModal, girisModal, durum: () => durum, kullanici: () => kullanici, roller: () => roller, taban: () => taban };
baslat();
})();
