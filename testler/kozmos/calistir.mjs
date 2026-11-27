// Kozmos otomatik testleri. Çalıştırma: node testler/kozmos/calistir.mjs [ad parçası]   (ayrıntı: OKUBENI.md)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { yaz as kuralYaz, kurallar } from './kural-sim.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url)), KOK = path.resolve(BURASI, '../..'), CIKTI = path.join(BURASI, 'cikti');
const SUZGEC = process.argv[2] || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml' };
const sunucu = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(KOK, p);
  if (!f.startsWith(KOK) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('yok'); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(r);
});
await new Promise(c => sunucu.listen(0, '127.0.0.1', c));
const TABAN = 'http://127.0.0.1:' + sunucu.address().port, U = (ek = '', dil = 'tr') => `${TABAN}/kozmos.html?lang=${dil}&ag=yok${ek}`;
const KROM = process.env.KOZ_CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const tarayici = await chromium.launch({ executablePath: KROM, args: ['--use-gl=swiftshader', '--no-sandbox'] });
const MASA = { w: 1280, h: 720 }, TEL = { w: 390, h: 844, mob: true }, YATAY = { w: 844, h: 390, mob: true };

const TESTLER = [];
const test = (ad, f) => TESTLER.push([ad, f]);
const esit = (a, b, ne) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${ne}: beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`); };
const acıFark = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const dogru = (k, ne) => { if (!k) throw new Error(ne); };
let ACIK = [];
async function sayfa({ w, h, mob } = MASA, { dil = 'tr', ek = '', once, git = true } = {}) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: h }, isMobile: !!mob, hasTouch: !!mob });
  const pg = await bag.newPage(); pg.hatalar = []; pg.on('pageerror', e => pg.hatalar.push(e.message.split('\n')[0]));
  await pg.route(/googlesyndication|goatcounter|zgo\.at|fonts\.g|gstatic|firebaseio|googleapis/, r => r.abort());
  if (once) await pg.addInitScript(once);
  ACIK.push(pg);
  if (git) { await pg.goto(U(ek, dil)); await pg.waitForFunction(() => window.KOZ, null, { timeout: 30000 }); }
  return pg;
}
const bekle = (pg, ms) => pg.waitForTimeout(ms);
async function basla(pg) { await pg.click('#mBasla'); await pg.waitForFunction(() => document.getElementById('menu').hidden); await bekle(pg, 250); await pg.evaluate(() => { const d = document.getElementById('diyalog'); if (d) d.hidden = true; }); }
const yenile = async pg => { await pg.reload(); await pg.waitForFunction(() => window.KOZ, null, { timeout: 30000 }); };
const kaydet = pg => pg.evaluate(() => dispatchEvent(new Event('pagehide')));
const pencereler = pg => pg.evaluate(() => [...document.querySelectorAll('.perde:not([hidden])')].map(p => p.id));
const hepsiniKapat = pg => pg.evaluate(() => document.querySelectorAll('.perde').forEach(p => p.hidden = true));

/* ---------- kaynak ve kurallar ---------- */
test('kaynak: parçalar ile kozmos.html aynı, betikler sözdizimi hatasız', async () => {
  execFileSync('python3', [path.join(KOK, 'kozmos/derle.py'), '--kontrol'], { stdio: 'pipe' });
  const s = fs.readFileSync(path.join(KOK, 'kozmos.html'), 'utf8');
  const ana = s.match(/<script>\n([\s\S]*?)<\/script>/), yak = s.match(/<script>(\/\* hata yakalayıcı[\s\S]*?)<\/script>/);
  dogru(ana && yak, 'betikler bulunamadı'); new Function(ana[1]); new Function(yak[1]);
  for (const f of ['kozmos-yonetim.html', 'kozmos/index.html']) for (const m of fs.readFileSync(path.join(KOK, f), 'utf8').matchAll(/<script>\n?([\s\S]*?)<\/script>/g)) new Function(m[1]);
  JSON.parse(fs.readFileSync(path.join(KOK, 'kozmos.webmanifest'), 'utf8'));
});

test('kurallar: sayaçlar şişirilemez (benzetim)', async () => {
  kurallar(JSON.parse(fs.readFileSync(path.join(KOK, 'firebase-kurallari-oyunlar.json'), 'utf8')).rules);
  let db = {}; const A = { uid: 'u1', token: {} }, B = { uid: 'u2', token: {} }, YON = { uid: 'adm', token: { email: 'erdalustunol@gmail.com', email_verified: true } }, T0 = 1795700000000, yanlis = [];
  const dene = (ad, bek, g, auth, now) => { const r = kuralYaz(db, g, auth, now); if (r.ok) db = r.yeni; if (!!r.ok !== bek) yanlis.push(ad + ' → ' + (r.ok ? 'kabul edildi' : r)); };
  const v = p => p.split('/').reduce((n, k) => n == null ? null : n[k], db) ?? 0;
  const ev = (u, m, now, ek = {}) => ({ ['kozmos/ev/2026-48/t']: v('kozmos/ev/2026-48/t') + m, ['kozmos/ev/2026-48/k/' + u + '/d']: v('kozmos/ev/2026-48/k/' + u + '/d') + m, ['kozmos/ev/2026-48/k/' + u + '/n']: 'Pilot', ['kozmos/ev/2026-48/k/' + u + '/z']: now, ...ek });
  dene('ev ilk katkı', true, ev('u1', 40, T0), A, T0);
  dene('ev hız sınırı', false, ev('u1', 5, T0 + 10000), A, T0 + 10000);
  dene('ev 50 sn sonra', true, ev('u1', 40, T0 + 50000), A, T0 + 50000);
  dene('ev tek seferde 41', false, ev('u1', 41, T0 + 100000), A, T0 + 100000);
  dene('ev yalnız toplam', false, { 'kozmos/ev/2026-48/t': v('kozmos/ev/2026-48/t') + 30 }, A, T0 + 100000);
  dene('ev toplam > katkı', false, { ...ev('u1', 10, T0 + 100000), 'kozmos/ev/2026-48/t': v('kozmos/ev/2026-48/t') + 100 }, A, T0 + 100000);
  dene('ev yalnız kendi katkısı', false, { 'kozmos/ev/2026-48/k/u1/d': 500, 'kozmos/ev/2026-48/k/u1/n': 'P', 'kozmos/ev/2026-48/k/u1/z': T0 + 100000 }, A, T0 + 100000);
  dene('ev başkasının kaydı', false, ev('u2', 10, T0 + 100000), A, T0 + 100000);
  dene('ev ikinci oyuncu', true, ev('u2', 7, T0 + 100000), B, T0 + 100000);
  dene('ev toplamı azaltma', false, { 'kozmos/ev/2026-48/t': 1 }, A, T0 + 200000);
  dene('ev sahte zaman', false, ev('u1', 5, T0 + 999999), A, T0 + 200000);
  db.kozmos.ev['2026-48'].k.u1.d = 1490; db.kozmos.ev['2026-48'].t = 1497;
  dene('ev haftalık tavan', false, ev('u1', 40, T0 + 300000), A, T0 + 300000);
  dene('ev tavana kadar', true, ev('u1', 10, T0 + 300000), A, T0 + 300000);
  const fr = (u, k, m, now) => ({ ['kozmos/fr/2026-48/' + k]: v('kozmos/fr/2026-48/' + k) + m, ['kozmos/fru/2026-48/' + u + '/' + k]: v('kozmos/fru/2026-48/' + u + '/' + k) + m, ['kozmos/fru/2026-48/' + u + '/z']: now });
  dene('fr ilk katkı', true, fr('u1', 'birlik', 50, T0), A, T0);
  dene('fr hız sınırı', false, fr('u1', 'klan', 5, T0 + 5000), A, T0 + 5000);
  dene('fr 51', false, fr('u1', 'klan', 51, T0 + 60000), A, T0 + 60000);
  dene('fr 60 sn sonra', true, fr('u1', 'klan', 3, T0 + 60000), A, T0 + 60000);
  dene('fr yalnız toplam', false, { 'kozmos/fr/2026-48/klan': 999 }, A, T0 + 120000);
  dene('fr geçersiz fraksiyon', false, { 'kozmos/fr/2026-48/x': 1, 'kozmos/fru/2026-48/u1/x': 1, 'kozmos/fru/2026-48/u1/z': T0 + 120000 }, A, T0 + 120000);
  dene('fr girişsiz', false, fr('u1', 'birlik', 1, T0 + 120000), null, T0 + 120000);
  const an = (u, olay, now, b, c) => ({ ['kozmos/an/20261126/' + olay]: v('kozmos/an/20261126/' + olay) + 1, ['kozmos/anu/' + u]: { b, c } });
  dene('an ilk olay', true, an('u1', 'acilis', T0, T0, 1), A, T0);
  dene('an ikinci olay', true, an('u1', 'ucus', T0 + 1000, T0, 2), A, T0 + 1000);
  dene('an sayaçsız olay', false, { 'kozmos/an/20261126/ucus': v('kozmos/an/20261126/ucus') + 1 }, A, T0 + 2000);
  dene('an sayacı sıfırlama', false, an('u1', 'ucus', T0 + 2000, T0 + 2000, 1), A, T0 + 2000);
  dene('an sayacı geri alma', false, { 'kozmos/anu/u1': { b: T0, c: 1 } }, A, T0 + 2000);
  dene('an +2', false, { 'kozmos/an/20261126/ucus': v('kozmos/an/20261126/ucus') + 2, 'kozmos/anu/u1': { b: T0, c: 3 } }, A, T0 + 2000);
  db.kozmos.anu.u1.c = 60;
  dene('an günlük tavan', false, an('u1', 'dk5', T0 + 3000, T0, 61), A, T0 + 3000);
  dene('an yeni pencere', true, an('u1', 'acilis', T0 + 90000000, T0 + 90000000, 1), A, T0 + 90000000);
  const rap = (id, now) => ({ ['kozmos/hata/' + id]: { m: 'TypeError: x @12:3', t: now, v: '2026.11.26', f: 1, u: 'Mozilla', e: '390x844', d: 'tr', k: 5000 }, 'kozmos/hataS': now });
  dene('hata girişsiz rapor', true, rap('h1', T0), null, T0);
  dene('hata genel kısıt', false, rap('h2', T0 + 2000), null, T0 + 2000);
  dene('hata 6 sn sonra', true, rap('h2', T0 + 6000), null, T0 + 6000);
  dene('hata damgasız', false, { 'kozmos/hata/h3': rap('x', T0 + 20000)['kozmos/hata/x'] }, null, T0 + 20000);
  dene('hata üstüne yazma', false, rap('h1', T0 + 30000), null, T0 + 30000);
  dene('hata başkası silemez', false, { 'kozmos/hata/h1': null }, A, T0 + 40000);
  dene('hata yönetici siler', true, { 'kozmos/hata/h1': null }, YON, T0 + 40000);
  dene('hata çok uzun', false, { ...rap('h9', T0 + 50000), 'kozmos/hata/h9': { m: 'x'.repeat(600), t: T0 + 50000, v: '1' } }, null, T0 + 50000);
  esit(yanlis, [], 'kural benzetimi');
});

/* ---------- açılış ---------- */
for (const [ad, ek, dil, metin] of [['bilgisayar, Türkçe', MASA, 'tr', 'Uçuşa başla'], ['telefon, İngilizce', TEL, 'en', 'Start flying']]) test('açılış: ' + ad, async () => {
  const pg = await sayfa(ek, { dil });
  dogru(await pg.evaluate(() => document.querySelector('#menu .kart').classList.contains('ilk')), 'ilk açılışta karşılama ekranı yok');
  esit(await pg.textContent('#mBasla'), metin, 'başla düğmesi');
  dogru(!(await pg.evaluate(() => document.getElementById('hataKutu'))), 'hata kutusu çıktı');
  await basla(pg); await pg.evaluate(() => { KOZ.SH.vx = KOZ.SH.vy = 0; });
  await pg.keyboard.down('w'); await bekle(pg, 900); await pg.keyboard.up('w');
  dogru(await pg.evaluate(() => Math.hypot(KOZ.SH.vx, KOZ.SH.vy)) > 5, 'gemi hareket etmedi');
  await kaydet(pg); await yenile(pg);
  dogru(!(await pg.evaluate(() => document.querySelector('#menu .kart').classList.contains('ilk'))), 'ikinci açılışta karşılama yine çıktı');
});

test('açılış hatası: ekranda kurtarma kutusu', async () => {
  const pg = await sayfa(TEL, { git: false });
  await pg.route(/kozmos\.html/, async r => { const y = await r.fetch(); r.fulfill({ response: y, body: (await y.text()).replace('<script>\n', '<script>\nthrow new Error("deneme çöküşü");\n') }); });
  await pg.goto(U()); await pg.waitForSelector('#hataKutu', { timeout: 15000 });
  const m = await pg.evaluate(() => document.getElementById('hataKutu').innerText);
  dogru(/deneme çöküşü/.test(m) && /Yeniden dene/.test(m) && /Yeni oyunla başla/.test(m), 'kutu içeriği eksik: ' + m);
  pg.hatalar = [];
});

/* ---------- pencereler ---------- */
for (const ek of [MASA, TEL]) test('pencereler: hepsi açılıp kapanıyor, taşma ve üst üste binme yok (' + ek.w + ')', async () => {
  const pg = await sayfa(ek); await basla(pg);
  await pg.evaluate(() => { dev.run('kilit ac'); KOZ.kredi = 500000; KOZ.can = 5000; KOZ.HIK.a = 15; });
  const sorun = [];
  const acKapat = async (ad, ac, kapat) => {
    try { await pg.evaluate(ac); } catch (e) { sorun.push(ad + ' açılamadı: ' + e.message.split('\n')[0]); return; }
    await bekle(pg, 300);
    const r = await pg.evaluate(() => {
      const v = [...document.querySelectorAll('.perde:not([hidden])')].sort((a, b) => (+getComputedStyle(a).zIndex || 0) - (+getComputedStyle(b).zIndex || 0)); if (!v.length) return null;
      const P = v[v.length - 1], ic = P.firstElementChild || P, R = ic.getBoundingClientRect();
      const nok = [[R.left + R.width / 2, R.top + Math.min(R.height / 2, 60)], [R.left + 20, R.top + 20], [R.right - 20, R.bottom - 20]];
      const ort = nok.map(([x, y]) => document.elementFromPoint(Math.min(innerWidth - 2, Math.max(1, x)), Math.min(innerHeight - 2, Math.max(1, y)))).filter(el => el && !P.contains(el)).map(el => el.id || el.className || el.tagName);
      return { id: P.id, ort, tasma: R.width > innerWidth + 2 || ic.scrollWidth > ic.clientWidth + 4 };
    });
    if (!r) { sorun.push(ad + ': pencere görünmedi'); return; }
    if (r.ort.length) sorun.push(ad + ' (' + r.id + ') üstünü kapatan: ' + [...new Set(r.ort)].join(','));
    if (r.tasma) sorun.push(ad + ' (' + r.id + ') yatay taşıyor');
    if (kapat) await pg.evaluate(kapat); else await pg.keyboard.press('Escape');
    await bekle(pg, 250);
    const kal = await pencereler(pg); if (kal.length) { sorun.push(ad + ': kapandıktan sonra açık kalan ' + kal.join(',')); await hepsiniKapat(pg); }
  };
  await acKapat('liman', () => KOZ.limanAc(KOZ.sistem(0, 0).gez[2]), () => document.getElementById('lmKalk').click());
  for (const s of ['ters', 'gemi', 'uret', 'ekip', 'elci', 'gorev', 'pazar']) { await pg.evaluate(s => { if (document.getElementById('liman').hidden) KOZ.limanAc(KOZ.sistem(0, 0).gez[2]); const b = document.querySelector('#lmSek [data-s="' + s + '"]'); if (b) b.click(); }, s); await bekle(pg, 120); }
  await pg.evaluate(() => { document.getElementById('lmKalk').click(); }); await bekle(pg, 200); await hepsiniKapat(pg);
  await acKapat('ambar', () => KOZ.ambarAc());
  for (const s of await pg.evaluate(() => { KOZ.ambarAc(); return [...document.querySelectorAll('#ambar [data-sek], #ambar [data-am]')].map(b => b.dataset.sek || b.dataset.am); })) { await pg.evaluate(s => KOZ.ambarAc(s), s); await bekle(pg, 80); }
  await hepsiniKapat(pg);
  await acKapat('banka', () => KOZ.bankaAc());
  await acKapat('borsa', () => KOZ.borsaAc());
  await acKapat('yıldız istasyonu', () => KOZ.istAc(0));
  await acKapat('kendi istasyon', () => { Object.assign(KOZ.KARGO, { metal: 99, elek: 99 }); KOZ.istnKur(KOZ.SH.x + 200, KOZ.SH.y); KOZ.istnAc(); });
  await acKapat('topluluk', () => KOZ.tpAc('soh'));
  await acKapat('pilot kartı', () => document.getElementById('profBtn').click());
  await acKapat('sezon', () => document.getElementById('sezCip').click());
  await acKapat('gemi tasarımı', () => KOZ.tasarimAc());
  await acKapat('hack', () => { KOZ.hackAc({ ad: 'Test', zor: 1, odul: () => '', ceza: () => '' }); document.querySelector('[data-hk=vaz]').click(); });
  await acKapat('tamir', () => { if (Object.keys(KOZ.MODUL)[0] == null) KOZ.MODUL.kalkan = 1; KOZ.tamirAc(Object.keys(KOZ.MODUL)[0]); });
  await acKapat('kalıntı bulmacası', () => KOZ.bulmacaAc(KOZ.sistem(0, 0).gez[3]));
  await acKapat('iniş', () => KOZ.inisAc(KOZ.sistem(0, 0).gez[2]), () => document.getElementById('inKalk').click());
  await acKapat('kendi koloni', () => { Object.assign(KOZ.KARGO, { metal: 99, makine: 99, enerji: 99, gida: 99, ilac: 99, su: 99, alasim: 9 }); for (let x = 0; x < 6 && !KOZ.KOL; x++) { const s = KOZ.sistem(x, 1); if (s) for (const p of s.gez) if (!p.kol && !KOZ.KOL) KOZ.kolKur(p); } KOZ.kolAc(); });
  await acKapat('bildirim geçmişi', () => KOZ.bilAc());
  await acKapat('menü', () => document.getElementById('ayarBtn').click());
  esit(sorun, [], 'pencere sorunları');
  await pg.evaluate(() => { KOZ.SH.vx = KOZ.SH.vy = 0; }); await pg.keyboard.down('w'); await bekle(pg, 800); await pg.keyboard.up('w');
  dogru(await pg.evaluate(() => Math.hypot(KOZ.SH.vx, KOZ.SH.vy)) > 5, 'pencere turundan sonra gemi takılı kaldı');
});

test('menü: 5 sekme dolu, Türkçe ve İngilizce', async () => {
  for (const dil of ['tr', 'en']) {
    const pg = await sayfa(TEL, { dil }); await basla(pg); await pg.click('#ayarBtn'); await bekle(pg, 250);
    for (const k of ['oyun', 'gor', 'kayit', 'top', 'def']) { await pg.click(`[data-ms=${k}]`); await bekle(pg, 120); dogru(await pg.evaluate(k => { const d = document.querySelector('.msp[data-p="' + k + '"]'); return !d.hidden && d.children.length > 0 && d.getBoundingClientRect().height > 20; }, k), dil + ' menü sekmesi boş: ' + k); }
    esit(await pg.evaluate(() => document.querySelector('#mSek [data-ms=gor] b').textContent), dil === 'tr' ? 'Görüntü' : 'Display', 'sekme adı');
  }
});

/* ---------- kayıt ---------- */
test('kayıt: gidiş-dönüş, sıfırlama, yedekler ve geri yükleme', async () => {
  const pg = await sayfa(TEL); await basla(pg);
  await pg.evaluate(() => { KOZ.kredi = 43210; for (let i = 0; i < 6; i++) KOZ.KESIF.add('s:8' + i + ',1'); }); await kaydet(pg); await yenile(pg);
  esit(await pg.evaluate(() => [KOZ.kredi, [...KOZ.KESIF].filter(x => x[0] === 's').length >= 6]), [43210, true], 'yeniden açılışta kayıt');
  esit(await pg.evaluate(() => JSON.parse(localStorage.getItem('kozmos-yedekler') || '[]').map(x => x.tur + ':' + x.oz.kr)), ['gun:43210'], 'günlük yedek');
  await basla(pg); await pg.evaluate(() => { KOZ.kredi = 99999; localStorage.setItem('kozmos-graf', '"dusuk"'); document.getElementById('ayarBtn').click(); }); await bekle(pg, 200);
  await pg.click('[data-ms=oyun]'); await pg.click('#mSifirla'); await bekle(pg, 150);
  await Promise.all([pg.waitForNavigation(), pg.click('#mSifirla')]); await pg.waitForFunction(() => window.KOZ);
  esit(await pg.evaluate(() => [KOZ.kredi, KOZ.KESIF.size, localStorage.getItem('kozmos-graf')]), [500, 0, '"dusuk"'], 'sıfırlama sonrası (ayarlar kalmalı)');
  esit(await pg.evaluate(() => JSON.parse(localStorage.getItem('kozmos-yedekler')).map(x => x.tur + ':' + x.oz.kr)), ['sifir:99999', 'gun:43210'], 'sıfırlama öncesi yedek');
  await pg.click('#ilkDiger'); await pg.click('[data-ms=kayit]'); await bekle(pg, 200);
  await pg.click('[data-yedek]'); await bekle(pg, 150); await Promise.all([pg.waitForNavigation(), pg.click('[data-yedek]')]); await pg.waitForFunction(() => window.KOZ);
  esit(await pg.evaluate(() => KOZ.kredi), 99999, 'geri yükleme sonrası kredi');
});

async function kayitTuru(pg) {
  return pg.evaluate(async () => {
    const z = ms => new Promise(r => setTimeout(r, ms)), t = id => { const e = document.getElementById(id); if (e) e.click(); };
    document.getElementById('mBasla').click(); await z(250); document.getElementById('diyalog').hidden = true;
    KOZ.ambarAc(); for (const b of document.querySelectorAll('#ambar button[data-sek], #ambar button[data-am]')) b.click(); t('amKapat');
    KOZ.limanAc(KOZ.sistem(0, 0).gez[2]); for (const b of document.querySelectorAll('#lmSek button')) b.click(); t('lmKalk');
    if (KOZ.KOL) { KOZ.kolAc(); t('kmKapat'); } if (KOZ.istn) { KOZ.istnAc(); t('isnKapat'); }
    t('profBtn'); t('prKapat'); t('sezCip'); t('szKapat'); KOZ.tasarimAc(); t('tsKapat'); t('ayarBtn'); await z(250);
    const bad = ['kredi', 'yakit', 'can'].filter(k => !Number.isFinite(KOZ[k])); if (!Number.isFinite(KOZ.SH.x) || !Number.isFinite(KOZ.SH.y)) bad.push('konum'); return bad;
  });
}
test('bozuk kayıt: her alan bozulsa da oyun açılıyor', async () => {
  const pg = await sayfa({ w: 900, h: 600 }); await basla(pg);
  await pg.evaluate(() => { dev.run('kilit ac'); KOZ.kredi = 90000; Object.assign(KOZ.KARGO, { metal: 30, elek: 10, gida: 12, su: 12, alasim: 6 }); KOZ.istnKur(KOZ.SH.x + 300, KOZ.SH.y); for (let x = 0; x < 6 && !KOZ.KOL; x++) { const s = KOZ.sistem(x, 1); if (s) for (const p of s.gez) if (!p.kol && !KOZ.KOL) KOZ.kolKur(p); } KOZ.sezXp(300); KOZ.limanAc(KOZ.sistem(0, 0).gez[2]); document.getElementById('lmKalk').click(); });
  await bekle(pg, 3500); await kaydet(pg);
  const temiz = await pg.evaluate(() => JSON.parse(localStorage.getItem('kozmos-kayit')));
  const genel = [null, 'x', 7, -1e12, [], {}, { a: 'b' }, [null, 'q']], ozel = { kargo: { zzz: 5, metal: 'x' }, yuk: { kargo: 99, tank: 'q' }, gorev: [null, { tip: 'zz' }], ekip: [null, { rol: 'zz' }], tak: ['yok', null], esk: [{ t: 'yok' }], kol: { z: [0, 0, 99], bina: null }, istn: { x: 1, y: 2 }, kiy: { kask: 'zz' }, guc: [6, 0, 0], mods: { kasif: 5 }, yer: { kasif: 'abc' }, rota: [{ x: 1 }], gun: { L: 'x', H: { k: 'zz' }, seri: 'a' }, prs: 99, evb: { hk: 5, b: 'x' }, frk: { a: 'b' }, acl: [null, 5] };
  const sorun = [], anahtarlar = Object.keys(temiz);
  dogru(anahtarlar.length > 50, 'kayıtta beklenenden az alan var: ' + anahtarlar.length);
  const dene = async (k, v) => {
    await pg.evaluate(k => { window.__seriYukleniyor = true; localStorage.setItem('kozmos-kayit', k); localStorage.removeItem('kozmos-yedekler'); }, JSON.stringify(Object.assign({}, temiz, { [k]: v })));
    const t1 = Date.now(); pg.hatalar = []; await pg.reload({ waitUntil: 'domcontentloaded' });
    let bad; try { await pg.waitForFunction(() => window.KOZ, null, { timeout: 8000 }); bad = await kayitTuru(pg); } catch (e) { bad = ['açılmadı: ' + e.message.split('\n')[0].slice(0, 100)]; }
    if (process.env.KOZ_AYRINTI) console.log('   ', k, JSON.stringify(v).slice(0, 30), ((Date.now() - t1) / 1000).toFixed(1) + ' sn', bad.join(',').slice(0, 120));
    if (pg.hatalar.length || bad.length) sorun.push(k + '=' + JSON.stringify(v) + ' → ' + [...new Set(pg.hatalar)].concat(bad).join(' ; ').slice(0, 200));
  };
  let i = 0; for (const k of anahtarlar) { await dene(k, genel[i % genel.length]); await dene(k, genel[(i + 3) % genel.length]); i++; }
  for (const [k, v] of Object.entries(ozel)) await dene(k, v);
  pg.hatalar = []; esit(sorun.slice(0, 8), [], 'bozuk kayıtla sorun çıkan alanlar');
});

/* ---------- oyun sistemleri ---------- */
test('kademeli açılma: kilitli sekme uyarır, sistem keşfedince açılır', async () => {
  const pg = await sayfa(TEL); await basla(pg);
  esit(await pg.evaluate(() => KOZ.ACL.size), 0, 'başta açık özellik');
  await pg.evaluate(() => KOZ.limanAc(KOZ.sistem(0, 0).gez[2])); await bekle(pg, 300); await pg.evaluate(() => { document.getElementById('diyalog').hidden = true; document.querySelector('#lmSek [data-s=uret]').click(); }); await bekle(pg, 200);
  dogru(/kilitli/.test(await pg.evaluate(() => document.getElementById('duyuru').textContent)), 'kilit uyarısı çıkmadı');
  await pg.evaluate(() => { document.getElementById('lmKalk').click(); for (let i = 1; i <= 6; i++) KOZ.KESIF.add('s:9' + i + ',0'); });
  await pg.waitForFunction(() => KOZ.ACL.has('uret') && KOZ.ACL.has('maden') && !KOZ.ACL.has('hack'), null, { timeout: 8000 });
});

test('günlük görev: tamamlanınca ödül veriyor', async () => {
  const pg = await sayfa(TEL); await basla(pg);
  await pg.waitForFunction(() => KOZ.GUN.L.length === 3 && KOZ.GUN.H, null, { timeout: 8000 });
  const k0 = await pg.evaluate(() => KOZ.kredi);
  await pg.evaluate(() => { const x = KOZ.GUN.L[0], S = KOZ.ST, m = { korsan: 'korsan', gorev: 'gorev', yanas: 'yanas', hurda: 'hurda', ast: 'astKir', uret: 'uret', yaris: 'yaris' }[x.k]; if (m) S[m] = (S[m] || 0) + x.n; else if (x.k === 'kesif') for (let i = 0; i < x.n; i++) KOZ.KESIF.add('s:7' + i + ',7'); else if (x.k === 'gez') for (let i = 0; i < x.n; i++) KOZ.KESIF.add('p:7,7:' + i); else if (x.k === 'ticaret') { S.gk = S.gk || {}; S.gk.ticaret = (S.gk.ticaret || 0) + x.n; } KOZ.gunKontrol(); });
  dogru(await pg.evaluate(() => KOZ.GUN.L[0].ok) === 1 && (await pg.evaluate(() => KOZ.kredi)) - k0 >= 600, 'günlük görev ödülü gelmedi');
});

test('bildirimler: aynısı birleşiyor, N geçmişi açıyor', async () => {
  const pg = await sayfa(MASA); await basla(pg); await pg.evaluate(() => { document.getElementById('duyuru').innerHTML = ''; for (let i = 0; i < 4; i++) KOZ.duyur('🪨 +2 metal', ''); KOZ.duyur('⚠ Korsan!', 'uyari'); });
  dogru(/×4/.test(await pg.evaluate(() => document.getElementById('duyuru').textContent)), 'bildirimler birleşmedi');
  await pg.keyboard.press('n'); await bekle(pg, 250); esit(await pencereler(pg), ['bilPen'], 'N tuşu'); await pg.keyboard.press('Escape'); await bekle(pg, 200); esit(await pencereler(pg), [], 'Esc');
});

test('oyun kolu ve titreşim', async () => {
  const pg = await sayfa(MASA, { once: () => { window.__pad = null; window.__tit = []; navigator.getGamepads = () => window.__pad ? [window.__pad] : []; navigator.vibrate = ms => { window.__tit.push(ms); return true; }; } });
  const pad = (ax, bt = []) => pg.evaluate(([ax, bt]) => { window.__pad = { connected: true, mapping: 'standard', axes: [ax[0], ax[1], 0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: bt.includes(i), value: bt.includes(i) ? 1 : 0 })) }; }, [ax, bt]);
  await pad([0, 0], [0]); await pg.waitForFunction(() => document.getElementById('menu').hidden, null, { timeout: 5000 }); await pad([0, 0]); await bekle(pg, 300);
  await pg.evaluate(() => { document.getElementById('diyalog').hidden = true; KOZ.SH.vx = KOZ.SH.vy = 0; }); await pad([0.7, -0.7]); await bekle(pg, 1500);
  dogru(await pg.evaluate(() => Math.hypot(KOZ.SH.vx, KOZ.SH.vy) > 50 && Math.abs(Math.atan2(Math.sin(KOZ.SH.a + Math.PI / 4), Math.cos(KOZ.SH.a + Math.PI / 4))) < 0.5), 'çubukla uçulamadı');
  await pad([1, 0], [7]); await pg.waitForFunction(() => KOZ.SH.warp > 0.25, null, { timeout: 8000 });
  await pad([0, 0], [9]); await bekle(pg, 200); await pad([0, 0]); await bekle(pg, 300); esit(await pencereler(pg), ['menu'], 'Start menüyü açmalı');
  await pad([0, 0], [1]); await bekle(pg, 200); await pad([0, 0]); await bekle(pg, 300); esit(await pencereler(pg), [], 'B menüyü kapatmalı');
  await pg.evaluate(() => KOZ.hasar(20)); dogru((await pg.evaluate(() => window.__tit.length)) >= 2, 'titreşim gelmedi');
});

test('sanal joystick: sürükleyince gemi o yöne gidiyor', async () => {
  const pg = await sayfa(TEL, { once: () => localStorage.setItem('kozmos-kont', '"joy"') }); await basla(pg);
  await pg.waitForFunction(() => !document.getElementById('joy').hidden, null, { timeout: 5000 });
  const r = await pg.evaluate(() => { const q = document.getElementById('joy').getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; });
  const cdp = await pg.context().newCDPSession(pg); await pg.evaluate(() => { KOZ.SH.vx = KOZ.SH.vy = 0; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r[0], y: r[1], id: 1 }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r[0] + i * 6, y: r[1] - i * 6, id: 1 }] }); await bekle(pg, 30); }
  await bekle(pg, 1000); const s = await pg.evaluate(() => [KOZ.SH.a, Math.hypot(KOZ.SH.vx, KOZ.SH.vy)]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  dogru(s[1] > 50 && acıFark(s[0], -Math.PI / 4) < 0.5, 'joystick çalışmadı: ' + JSON.stringify(s));
});

test('mevsimlik etkinlik: zorlanınca parçalar çıkıyor ve toplanıyor', async () => {
  const pg = await sayfa(MASA); await basla(pg); await pg.evaluate(() => dev.run('mevsim kis'));
  await pg.waitForFunction(() => KOZ.MEVP.length > 0, null, { timeout: 5000 });
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => { const L = KOZ.MEVP; if (L.length) { KOZ.SH.x = L[0].x; KOZ.SH.y = L[0].y; } }); await bekle(pg, 80); }
  dogru(await pg.evaluate(() => Object.values(KOZ.ST.mev || {}).some(n => n >= 1)), 'etkinlik parçası toplanmadı');
});

for (const ek of [TEL, YATAY, MASA]) test('ekran: paneller birbirinin üstüne binmiyor (' + ek.w + 'x' + ek.h + ')', async () => {
  const pg = await sayfa(ek, { once: () => localStorage.setItem('kozmos-fps', 'true') }); await basla(pg);
  await pg.evaluate(() => { KOZ.REH.kapali = false; KOZ.rehYaz(); document.getElementById('duyuru').innerHTML = ''; }); await bekle(pg, 1800);
  const cak = await pg.evaluate(() => {
    const el = [...document.body.children].filter(e => { const c = getComputedStyle(e); return e.id && !['c', 'duyuru', 'miniAd', 'er-durum', 'ust'].includes(e.id) && (c.position === 'fixed' || c.position === 'absolute') && !e.classList.contains('perde') && !e.hidden && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && e.getBoundingClientRect().width > 8; });
    const R = el.map(e => [e.id, e.getBoundingClientRect()]), out = [];
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const [a, A] = R[i], [b, B] = R[j], w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top); if (w > 6 && h > 6) out.push(a + '×' + b + ' ' + Math.round(w) + 'x' + Math.round(h)); }
    return out;
  });
  esit(cak, [], 'çakışan paneller');
});

for (const ek of [MASA, TEL]) test('rastgele kullanım: hata ve bozuk değer çıkmıyor (' + ek.w + ')', async () => {
  const pg = await sayfa(ek); pg.on('dialog', d => d.dismiss().catch(() => { })); await basla(pg);
  await pg.evaluate(() => { dev.run('kilit ac'); KOZ.kredi = 2e6; KOZ.can = 9000; Object.assign(KOZ.KARGO, { metal: 40, elek: 20, gida: 20, su: 20, alasim: 10 }); });
  let s = 9301 + ek.w; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, son = [];
  for (let i = 0; i < 140 && !pg.hatalar.length; i++) {
    const t = r();
    try {
      if (t < 0.62) {
        const h = await pg.evaluate(q => { const ok = el => { if (el.disabled || el.closest('[hidden]')) return false; const R = el.getBoundingClientRect(); if (R.width < 2 || R.height < 2 || R.bottom < 0 || R.top > innerHeight || R.right < 0 || R.left > innerWidth) return false; const e2 = document.elementFromPoint(R.left + R.width / 2, R.top + R.height / 2); return e2 && (e2 === el || el.contains(e2)); }; const L = [...document.querySelectorAll('button, [role=button], input[type=checkbox], select, .gpb')].filter(ok).filter(el => !/mSifirla|prsBtn|kurBtn|prBag|prPaylas|prIndir/.test(el.id) && !el.closest('#devPanel') && !el.closest('[data-yedek]') && !el.matches('[data-yedek],[data-bl]')); if (!L.length) return null; const el = L[Math.floor(q * L.length)], R = el.getBoundingClientRect(); return { x: R.left + R.width / 2, y: R.top + R.height / 2, ad: (el.id || el.className || el.tagName) + ':' + (el.textContent || '').trim().slice(0, 16) }; }, r());
        if (h) { await pg.mouse.click(h.x, h.y); son.push(h.ad); }
      } else if (t < 0.85) { const T2 = ['w', 'a', 'd', 's', 'e', 'i', 'm', 'Escape', 'q', 'r', 'g', 'z', 'x', 'c', 'h', 'k', 'v', 'p', 'Tab', 'Space', '1', '2', 'Enter', 'b', 'l', 'n', 'o', 'u', 't', 'j', 'y'], k = T2[Math.floor(r() * T2.length)]; await pg.keyboard.down(k); await bekle(pg, 50 + r() * 300); await pg.keyboard.up(k); son.push('tuş ' + k); }
      else if (t < 0.93) { await pg.mouse.click(r() * ek.w, r() * ek.h, { button: r() < 0.2 ? 'right' : 'left' }); son.push('tık'); }
      else await bekle(pg, 200 + r() * 500);
      await bekle(pg, 50);
    } catch (e) { if (/closed|crash/i.test(e.message)) throw e; }
  }
  if (pg.hatalar.length) throw new Error(pg.hatalar[0] + ' | son eylemler: ' + son.slice(-6).join(' > '));
  esit(await pg.evaluate(() => ['kredi', 'yakit', 'can'].filter(k => !Number.isFinite(KOZ[k])).concat(Number.isFinite(KOZ.SH.x) ? [] : ['konum'])), [], 'bozuk sayılar');
});

test('tanıtım sayfası açılıyor (Türkçe ve İngilizce)', async () => {
  for (const [dil, bas] of [['tr', 'Evrenden kareler'], ['en', 'A taste of the universe']]) {
    const pg = await sayfa(TEL, { git: false }); await pg.goto(`${TABAN}/kozmos/?lang=${dil}`); await bekle(pg, 600);
    esit(await pg.evaluate(() => document.querySelector('h2').textContent), bas, 'tanıtım başlığı');
    esit(await pg.evaluate(async () => { const y = []; for (const i of document.images) { const u = i.getAttribute('src'); if (u && !(await fetch(u)).ok) y.push(u); } return y; }), [], 'eksik görsel');
  }
});

/* ---------- koşucu ---------- */
let kalan = 0; const t00 = Date.now();
for (const [ad, f] of TESTLER) {
  if (SUZGEC && !ad.toLowerCase().includes(SUZGEC.toLowerCase())) continue;
  const t0 = Date.now(); ACIK = []; let hata = null;
  try { await f(); for (const pg of ACIK) if (pg.hatalar.length) throw new Error('sayfa hatası: ' + [...new Set(pg.hatalar)].slice(0, 3).join(' | ')); } catch (e) { hata = e; }
  if (hata) { kalan++; fs.mkdirSync(CIKTI, { recursive: true }); let i = 0; for (const pg of ACIK) { try { await pg.screenshot({ path: path.join(CIKTI, ad.replace(/[^a-z0-9ğüşöçıİ]+/gi, '-').slice(0, 60) + '-' + (i++) + '.png') }); } catch (e) { } } }
  console.log((hata ? '✗ ' : '✓ ') + ad + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + ' sn)' + (hata ? '\n    ' + String(hata.message).split('\n')[0] : ''));
  for (const pg of ACIK) await pg.context().close().catch(() => { });
}
await tarayici.close(); sunucu.close();
console.log(kalan ? `\n${kalan} test başarısız (ekran görüntüleri: testler/kozmos/cikti/)` : `\nBütün testler geçti (${((Date.now() - t00) / 1000).toFixed(0)} sn)`);
process.exit(kalan ? 1 : 0);
