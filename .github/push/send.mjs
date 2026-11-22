/* İngilizce Kulübü · kelime bildirimi göndericisi
   GitHub Actions her 15 dakikada bir çalıştırır. Firestore'daki push/{uid} kayıtlarına bakar,
   saati gelen kullanıcıya kuyruğundaki sıradaki kelimeyi Web Push ile gönderir.
   Ek paket kullanmaz: şifreleme (RFC 8291), VAPID (RFC 8292) ve Firestore REST, Node'un kendi modülleriyle.

   Gerekli gizli değişkenler (GitHub → Settings → Secrets and variables → Actions):
     FIREBASE_SA    Firebase hizmet hesabı JSON dosyasının tüm içeriği
     VAPID_PRIVATE  VAPID özel anahtarı (base64url, 43 karakter)
   İsteğe bağlı: FORCE=true → saate bakmadan herkese bir kelime gönderir (deneme için).
   Kullanıcı sayfadan "Sunucudan test gönder" derse belgeye test=true yazılır; bir sonraki çalışmada saate bakılmadan yalnız ona gönderilir. */
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const VAPID_PUBLIC = 'BGPY6KZFQc8GQbAQQiw-0CBI8X6mrn9VHS7yC8fU8Lbw3Ep5H1OyBLXl6ADn_vGn2fp6F64JL1cMdIFhooZM_BQ';
const SUBJECT = process.env.VAPID_SUBJECT || 'https://erdevelop.github.io';
const SITE = 'https://erdevelop.github.io/ingilizce.html';
/* hangi kulübün sayfası: push belgesindeki page alanı (yoksa İngilizce) */
const PAGES = { ingilizce: { url: SITE, icon: '📚', tag: 'eng-kelime' }, fransizca: { url: 'https://erdevelop.github.io/fransizca.html', icon: '🇫🇷', tag: 'fra-kelime' },
  almanca: { url: 'https://erdevelop.github.io/almanca.html', icon: '🇩🇪', tag: 'deu-kelime' },
  seri: { url: 'https://erdevelop.github.io/oyunlar/', icon: '🔥', tag: 'ob-seri' },
  zeki: { url: 'https://erdevelop.github.io/yapay-zeki/', icon: '⏰', tag: 'zeki-hatirlat' },
  balik: { url: 'https://erdevelop.github.io/derin-mavi.html', icon: '🐟', tag: 'derin-mavi' } };
const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(String(s), 'base64url');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

/* ---------- Web Push şifreleme (RFC 8291, aes128gcm) ---------- */
export function encrypt(payload, p256dh, auth, opt = {}) {
  const uaPub = unb64u(p256dh), secret = unb64u(auth);
  const ecdh = crypto.createECDH('prime256v1');
  if (opt.asPrivate) ecdh.setPrivateKey(unb64u(opt.asPrivate)); else ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), shared = ecdh.computeSecret(uaPub);
  const ikm = hmac(hmac(secret, shared), Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub, Buffer.from([1])]));
  const salt = opt.salt ? unb64u(opt.salt) : crypto.randomBytes(16), prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, body]);
}

/* ---------- VAPID imzası (ES256 JWT) ---------- */
export function vapidAuth(endpoint, privateKey, publicKey = VAPID_PUBLIC, now = Date.now()) {
  const pub = unb64u(publicKey), key = crypto.createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), claims = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: SUBJECT }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + claims), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${claims}.${b64u(sig)}, k=${publicKey}`;
}

export async function sendPush(sub, data, privateKey) {
  const body = encrypt(JSON.stringify(data), sub.keys.p256dh, sub.keys.auth);
  const r = await fetch(sub.endpoint, { method: 'POST', body, headers: {
    Authorization: vapidAuth(sub.endpoint, privateKey), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
    /* Urgency high: Android uyku modundayken (Doze) normal öncelikli bildirimler saatlerce bekletilip TTL dolunca düşüyordu.
       Topic: kulüp başına ayrı; aynı telefonda İngilizce ve Fransızca açıksa biri diğerinin yerine geçmesin. */
    TTL: '3600', Urgency: 'high', Topic: String(data.tag || 'erdevelop').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) } });
  return { status: r.status, text: r.ok ? '' : (await r.text()).slice(0, 300) };
}

/* ---------- zamanlama ---------- */
export function localNow(tz, now = new Date()) {
  let p; try { p = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now); }
  catch (e) { return localNow('Europe/Istanbul', now); }
  const g = t => p.find(x => x.type === t).value; return { date: `${g('year')}-${g('month')}-${g('day')}`, min: +g('hour') * 60 + +g('minute') };
}
const toMin = s => { const [h, m] = String(s || '').split(':').map(Number); return h * 60 + (m || 0); };
/* saati gelmiş ve henüz gönderilmemiş en son bildirim anı; yoksa null. win: GitHub zamanlayıcısının gecikme payı (dk)
   Bitiş başlangıçtan önceyse (09:00–00:00, 22:00–02:00) aralık gece yarısını geçer: gece yarısından sonraki anlar bir önceki günün aralığına sayılır. */
export function dueSlot(d, now = new Date(), win = 50) {
  const { date, min } = localNow(d.tz, now); let a = toMin(d.from), b = toMin(d.to); const st = Math.max(15, +d.step || 180);
  if (!(a >= 0 && b >= 0)) return null; if (b < a) b += 1440;
  const yday = localNow(d.tz, new Date(now.getTime() - 864e5)).date;
  let best = null, day = null;
  for (const [m, dt] of [[min, date], [min + 1440, yday]]) for (let s = a; s <= b; s += st) if (s <= m && m - s < win && (best == null || m - s < best.diff)) { best = { s, diff: m - s }; day = dt; }
  if (best == null) return null; const key = day + '|' + best.s; return key === d.last ? null : key;
}
/* bildirim metni: kelime cümlenin içinde öğrenilsin.
   Anlamı açıkken: başlık "kelime — anlam", gövde İngilizce cümle + Türkçesi. Kapalıyken: başlık kelime, gövde yalnız İngilizce cümle.
   Kuyrukta cümlesi olmayan eski kayıtlar için ORN (sitedeki js/ornek-en.js) kullanılır. Sayfadaki "Örnek bildirim" de aynı biçimi kullanır. */
export function message(d, ORN = {}, now = new Date()) {
  /* Oyun Bahçesi seri hatırlatıcısı: o gün bir günlük bulmaca çözüldüyse gönderilmez */
  if (d.page === 'seri') { if (d.done && d.done === localNow(d.tz, now).date) return null; const s = +d.seri || 0;
    return { title: '🔥 ' + (s > 1 ? s + ' günlük serin bozulmasın' : 'Bugünün bulmacaları hazır'), body: s > 1 ? 'Bugün henüz bir günlük bulmaca çözmedin. Günlük Kelime, Bir İşlem, Sudoku ya da Günün Cephe Terimi.' : 'Günlük Kelime, Bir İşlem, Sudoku ve Günün Cephe Terimi seni bekliyor.', url: PAGES.seri.url, tag: PAGES.seri.tag }; }
  const q = d.q || []; if (!q.length) return null; const w = q[(d.pos || 0) % q.length];
  const P = PAGES[d.page] || PAGES.ingilizce, o = (d.page || 'ingilizce') === 'ingilizce' ? ORN[w.e] : null, mean = d.mean !== false;
  const x = w.x || (o ? o[0] : ''), y = w.y || (o && o[0] === x ? o[1] : '');
  return { title: P.icon + ' ' + w.e + (mean ? ' — ' + w.t : ''),
    body: x ? x + (mean ? (y ? '\n' + y : '') : '\nAnlamı için dokun.') : mean ? 'Dokun, kartı aç.' : 'Anlamını hatırlıyor musun? Dokun ve kontrol et.',
    url: P.url + '?k=' + encodeURIComponent(w.e) + '#kelime', tag: P.tag };
}
/* Derin Mavi: balık acıkınca (ac: o anın zamanı, ms) bir kez; seri varken o gün gelinmediyse akşam d.saat'te bir kez.
   Yalnız 09.00–22.00 arası gönderilir. Dönen upd belgeye yazılır (aynı bildirim ikinci kez gitmesin). */
export function balikMesaj(d, now = new Date()) {
  const { date, min } = localNow(d.tz, now); if (min < 540 || min > 1320) return null;
  const en = d.dil === 'en', ad = String(d.ad || (en ? 'Your fish' : 'Balığın')).slice(0, 16), P = PAGES.balik;
  const ol = +d.olum || 0, kalanG = ol ? Math.ceil((ol - now.getTime()) / 864e5) : 0;
  if (ol && kalanG >= 1 && kalanG <= 4 && d.lastOlum !== date)
    return { msg: { title: en ? `⚠️ ${ad} is starving` : `⚠️ ${ad} açlıktan ölmek üzere`, body: en ? `It hasn’t eaten for days. Feed it within ${kalanG} day${kalanG > 1 ? 's' : ''} or it will lay its eggs and die.` : `Günlerdir hiç yemek yemedi. ${kalanG} gün içinde beslemezsen yumurtalarını bırakıp ölecek.`, url: P.url, tag: P.tag + '-olum' }, upd: { lastOlum: date } };
  if (+d.ac && now.getTime() >= +d.ac && String(d.lastAc || '') !== String(d.ac))
    return { msg: { title: en ? `🐟 ${ad} is hungry` : `🐟 ${ad} acıktı`, body: en ? 'Drop some food so it keeps growing. The plankton hunt and today’s surprise are waiting too.' : 'Biraz yem at da büyümeye devam etsin. Plankton avı ve günün sürprizi de seni bekliyor.', url: P.url, tag: P.tag }, upd: { lastAc: +d.ac } };
  if (+d.sefer && now.getTime() >= +d.sefer && String(d.lastSefer || '') !== String(d.sefer))
    return { msg: { title: en ? '🧭 Your explorer is back' : '🧭 Kâşif denizatı döndü', body: en ? `It brought loot for ${ad}. Come and collect it!` : `${ad} için ganimet getirdi. Gel ve topla!`, url: P.url, tag: P.tag + '-sefer' }, upd: { lastSefer: +d.sefer } };
  const s = +d.seri || 0;
  if (s >= 2 && d.done !== date && min >= toMin(d.saat || '20:30') && d.lastSeri !== date)
    return { msg: { title: en ? `🔥 Keep your ${s}-day streak` : `🔥 ${s} günlük serin bozulmasın`, body: en ? `${ad} is waiting. One feed today is enough.` : `${ad} seni bekliyor. Bugün bir kez yem atman yeterli.`, url: P.url, tag: P.tag + '-seri' }, upd: { lastSeri: date } };
  return null;
}
/* Yapay Zeki: zamanı gelmiş (en çok 6 saat gecikmiş) hatırlatmalar */
export function zekiDue(L, now = new Date()) { const t = now.getTime(); return (L || []).filter(h => +h.z <= t + 60e3 && +h.z > t - 6 * 3600e3); }
export function zekiMessage(h) { return { title: '⏰ Zeki hatırlatıyor', body: String(h.m || 'Hatırlatma zamanı!').slice(0, 160), url: PAGES.zeki.url, tag: 'zeki-' + h.z }; }

/* Yapay Zeki uyarıları (hj listesinde t alanı olan kayıtlar):
   { t:'h', i, k:'ruzgar'|'yagmur'|'kar'|'don'|'sicak', e:eşik, y:yer, la, lo, s:'19:00', g:'YYYY-AA-GG' (tek gün; yoksa her akşam), son }
     → akşam s saatinde ertesi günün tahminine bakar; koşul tutarsa bildirir.
   { t:'k', i, c:'USD', y:'>'|'<', e:eşik, son }  → kur eşiği geçince bir kez bildirir, sonra silinir.
   { t:'s', i, s:'08:00', y, la, lo, son }          → her sabah s saatinde hava, kur ve günün hatırlatmaları. */
const gunEkle = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const sayiTR = (n, k = 1) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: k });
const KUR_AD = { USD: 'Dolar', EUR: 'Avro', GBP: 'Sterlin', CHF: 'İsviçre frangı' };
export const HAVA_KOS = {
  ruzgar: { ad: 'rüzgâr', ikon: '🌬️', bak: g => g.ruzgar, birim: 'km/s', tut: (v, e) => v >= e },
  yagmur: { ad: 'yağış olasılığı', ikon: '🌧️', bak: g => g.yo, birim: '%', tut: (v, e, g) => v >= e || g.yag >= 5 },
  kar: { ad: 'kar', ikon: '🌨️', bak: g => g.kar, birim: 'cm', tut: v => v > 0 },
  don: { ad: 'en düşük sıcaklık', ikon: '🥶', bak: g => g.min, birim: '°C', tut: (v, e) => v <= e },
  sicak: { ad: 'en yüksek sıcaklık', ikon: '🥵', bak: g => g.max, birim: '°C', tut: (v, e) => v >= e },
};
/* Open-Meteo günlük tahmini → { 'YYYY-AA-GG': { max, min, ruzgar, hamle, yo, yag, kar, kod } } */
export function havaGunleri(j) {
  const d = (j && j.daily) || {}, out = {};
  (d.time || []).forEach((t, i) => { out[t] = { max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], ruzgar: d.wind_speed_10m_max[i], hamle: d.wind_gusts_10m_max[i], yo: d.precipitation_probability_max[i], yag: d.precipitation_sum[i], kar: d.snowfall_sum[i], kod: d.weather_code[i] }; });
  return out;
}
export async function havaGetir(la, lo) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${(+la).toFixed(3)}&longitude=${(+lo).toFixed(3)}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,precipitation_sum,snowfall_sum,weather_code&timezone=auto&forecast_days=3`;
  const r = await fetch(u); if (!r.ok) throw new Error('hava ' + r.status); return havaGunleri(await r.json());
}
export async function kurGetir() {
  const r = await fetch('https://api.frankfurter.dev/v1/latest?base=TRY&symbols=USD,EUR,GBP,CHF'); if (!r.ok) throw new Error('kur ' + r.status);
  const j = await r.json(); return Object.fromEntries(Object.entries(j.rates || {}).map(([k, v]) => [k, 1 / v]));
}
const havaCumle = g => `${sayiTR(g.min, 0)}–${sayiTR(g.max, 0)}°C, rüzgâr ${sayiTR(g.ruzgar, 0)} km/s${g.yo != null ? `, yağış olasılığı %${g.yo}` : ''}`;
/* L: hj listesi; tz: kullanıcının saat dilimi; al: { hava(la,lo), kur() } (testte sahte verilebilir)
   → { mesajlar: [{ msg, kayit }], liste: güncel hj } ; hatırlatmalar (z alanı) burada işlenmez */
export async function zekiUyarilar(L, now = new Date(), tz = 'Europe/Istanbul', al = { hava: havaGetir, kur: kurGetir }) {
  const { date, min } = localNow(tz, now), mesajlar = [], liste = [];
  const onbellek = {}, hava = (la, lo) => { const k = (+la).toFixed(2) + ',' + (+lo).toFixed(2); return onbellek[k] || (onbellek[k] = al.hava(la, lo)); };
  let kurP = null; const kur = () => kurP || (kurP = al.kur());
  for (const u of L || []) {
    if (!u || !u.t) { liste.push(u); continue; }
    try {
      if (u.t === 'h') {
        const K = HAVA_KOS[u.k]; if (!K) continue;
        const hedef = u.g || gunEkle(date, 1);
        if (u.g && date > u.g) continue;                              /* tek günlük uyarının günü geçti */
        const zamani = (date === gunEkle(hedef, -1) && min >= toMin(u.s || '19:00')) || (u.g && date === u.g);
        if (!zamani || u.son === date) { liste.push(u); continue; }
        const G = (await hava(u.la, u.lo))[hedef];
        if (!G) { liste.push(u); continue; }
        const v = K.bak(G), tut = v != null && K.tut(v, +u.e, G), gun = hedef === gunEkle(date, 1) ? 'Yarın' : 'Bugün';
        if (tut) mesajlar.push({ kayit: u, msg: { title: `${K.ikon} ${gun} ${u.y || ''}: ${K.ad} ${sayiTR(v, 0)} ${K.birim}`.replace(/\s+/g, ' '), body: (u.k === 'ruzgar' && G.hamle ? `Hamlelerde ${sayiTR(G.hamle, 0)} km/s'ye çıkabilir. ` : '') + `Eşiğin ${sayiTR(u.e, 0)} ${K.birim}. ${havaCumle(G)}.`, url: PAGES.zeki.url, tag: 'zeki-h-' + u.i } });
        if (!u.g) liste.push({ ...u, son: date });                    /* her akşam: kalsın */
      } else if (u.t === 'k') {
        const R = await kur(), v = R[u.c]; if (!v) { liste.push(u); continue; }
        const tut = u.y === '<' ? v <= +u.e : v >= +u.e;
        if (tut) mesajlar.push({ kayit: u, msg: { title: `💱 ${KUR_AD[u.c] || u.c} ${sayiTR(v, 4)} ₺`, body: `Belirlediğin ${sayiTR(u.e, 2)} ₺ eşiği ${u.y === '<' ? 'altına inildi' : 'geçildi'}. (Avrupa Merkez Bankası günlük kuru)`, url: PAGES.zeki.url, tag: 'zeki-k-' + u.i } });
        else liste.push(u);
      } else if (u.t === 's') {
        const s = toMin(u.s || '08:00');
        if (u.son === date || min < s || min - s > 180) { liste.push(u); continue; }
        const sat = [];
        if (u.la != null) { const G = (await hava(u.la, u.lo).catch(() => ({})))[date]; if (G) sat.push(`🌤 ${u.y || 'Hava'}: ${havaCumle(G)}`); }
        const R = await kur().catch(() => null); if (R && R.USD) sat.push(`💱 Dolar ${sayiTR(R.USD, 2)} · Avro ${sayiTR(R.EUR, 2)} ₺`);
        const bugun = (L || []).filter(h => h && h.z && localNow(tz, new Date(+h.z)).date === date && +h.z > now.getTime());
        if (bugun.length) sat.push(`⏰ Bugün ${bugun.length} hatırlatman var: ` + bugun.slice(0, 3).map(h => String(h.m).slice(0, 40)).join(', '));
        mesajlar.push({ kayit: u, msg: { title: '☀️ Günaydın! Zeki\'nin sabah özeti', body: sat.join('\n') || 'Güzel bir gün geçirmeni dilerim.', url: PAGES.zeki.url + '?ozet=1', tag: 'zeki-sabah' } });
        liste.push({ ...u, son: date });
      } else liste.push(u);
    } catch (e) { console.log('  zeki uyarısı denetlenemedi: ' + (e.message || e)); liste.push(u); }
  }
  return { mesajlar, liste };
}

/* sitedeki örnek cümleler; alınamazsa boş (bildirim cümlesiz gider) */
export async function loadOrnek(url = 'https://erdevelop.github.io/js/ornek-en.js') {
  try { const r = await fetch(url); if (!r.ok) return {}; const t = await r.text(); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch (e) { return {}; }
}

/* ---------- Firestore REST ---------- */
export function fromValue(v) {
  if (!v) return null; if ('stringValue' in v) return v.stringValue; if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue); if ('doubleValue' in v) return v.doubleValue; if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue; if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue); return null;
}
const fromFields = f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]));
const toValue = v => typeof v === 'boolean' ? { booleanValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : v instanceof Date ? { timestampValue: v.toISOString() } : v == null ? { nullValue: null } : { stringValue: String(v) };

async function token(sa) {
  const now = Math.floor(Date.now() / 1000), aud = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const jwt = [b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })), b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud, iat: now, exp: now + 3600 }))].join('.');
  const sig = crypto.sign('RSA-SHA256', Buffer.from(jwt), sa.private_key);
  const r = await fetch(aud, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt + '.' + b64u(sig) }) });
  const j = await r.json(); if (!j.access_token) throw new Error('Google girişi başarısız: ' + JSON.stringify(j).slice(0, 200)); return j.access_token;
}

/* hangi bildirim servisi: teşhis için (kişisel bilgi içermez) */
export const svc = ep => { try { const h = new URL(ep).hostname; return /fcm|googleapis/.test(h) ? 'Android/Chrome' : /apple/.test(h) ? 'iPhone/Safari' : /mozilla/.test(h) ? 'Firefox' : /notify\.windows|wns/.test(h) ? 'Windows/Edge' : h; } catch (e) { return '?'; } };

export async function main(env = process.env) {
  if (!env.FIREBASE_SA || !env.VAPID_PRIVATE) throw new Error('FIREBASE_SA ve VAPID_PRIVATE gizli değişkenleri tanımlı değil.');
  const sa = JSON.parse(env.FIREBASE_SA), base = (env.FIRESTORE_BASE || 'https://firestore.googleapis.com/v1') + `/projects/${sa.project_id}/databases/(default)/documents`;
  const auth = { Authorization: 'Bearer ' + await token(sa) }, force = env.FORCE === 'true', now = new Date();
  const r = await fetch(base + ':runQuery', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'push' }], where: { fieldFilter: { field: { fieldPath: 'on' }, op: 'EQUAL', value: { booleanValue: true } } } } }) });
  if (!r.ok) throw new Error('Firestore okunamadı: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const all = (await r.json()).filter(x => x.document).map(x => ({ ...fromFields(x.document.fields || {}), _path: x.document.name }));
  /* aynı telefona bağlı birden fazla hesap varsa yalnızca en son ayarlanan kullanılır, diğerleri kapatılır (çift bildirim olmasın) */
  /* İngilizce ve Fransızca aynı telefonda ayrı ayrı açık olabilir: anahtar = adres + sayfa */
  const epKey = d => d.sub.endpoint + '|' + (d.page || 'ingilizce');
  const byEp = new Map(); for (const d of all) { const ep = d.sub && d.sub.endpoint; if (!ep) continue; const k = epKey(d), o = byEp.get(k); if (!o || String(d.upd || '') > String(o.upd || '')) byEp.set(k, d); }
  const docs = [...byEp.values()], dupes = all.filter(d => d.sub && d.sub.endpoint && byEp.get(epKey(d)) !== d);
  const patch = async (d, upd) => { const mask = Object.keys(upd).map(k => 'updateMask.fieldPaths=' + k).join('&');
    const url = env.FIRESTORE_BASE ? base + '/' + d._path.split('/documents/')[1] : 'https://firestore.googleapis.com/v1/' + d._path;
    const p = await fetch(url + '?' + mask, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(upd).map(([k, v]) => [k, toValue(v)])) }) });
    if (!p.ok) console.log('  kayıt güncellenemedi: ' + p.status + ' ' + (await p.text()).slice(0, 200)); return p.ok; };
  for (const d of dupes) { await patch(d, { on: false, err: 'Bu telefon başka bir hesapla bildirim alıyor; çift bildirim olmasın diye bu hesapta kapatıldı.' }); console.log('  aynı telefonda ikinci hesap kapatıldı: ' + d._path.split('/').pop().slice(0, 6) + '…'); }
  const ORN = env.ORNEK_URL === 'yok' ? {} : await loadOrnek(env.ORNEK_URL); if (!Object.keys(ORN).length) console.log('  örnek cümle dosyası alınamadı; kuyruktaki cümleler kullanılacak');
  let sent = 0, skipped = 0, failed = 0;
  for (const d of docs) {
    /* Yapay Zeki hatırlatmaları: hj = [{ z: zaman (ms), m: metin }]; zamanı gelenler gönderilir, kalanlar saklanır */
    if (d.page === 'zeki') {
      let L = []; try { L = JSON.parse(d.hj || '[]'); } catch (e) { }
      const H = L.filter(h => h && !h.t), U = await zekiUyarilar(L.filter(h => h && h.t), now, d.tz, env.ZEKI_AL || undefined);
      const due = zekiDue(H, now), kalan = H.filter(h => !due.includes(h) && +h.z > now.getTime() - 6 * 3600e3).concat(U.liste);
      const giden = due.map(zekiMessage).concat(U.mesajlar.map(x => x.msg));
      const degisti = JSON.stringify(kalan) !== JSON.stringify(L);
      if (!d.sub || !d.sub.endpoint || (!giden.length && !degisti)) { skipped++; continue; }
      let ok = true;
      for (const msg of giden) {
        let res; try { res = await sendPush(d.sub, msg, env.VAPID_PRIVATE); } catch (e) { res = { status: 0, text: String(e.message || e) }; }
        console.log(`  ${d._path.split('/').pop().slice(0, 6)}… zeki · ${svc(d.sub.endpoint)} → ${res.status}`);
        if (res.status >= 200 && res.status < 300) sent++; else { failed++; ok = false; if (res.status === 404 || res.status === 410) { await patch(d, { on: false, err: 'Telefon aboneliği artık geçerli değil; Zeki\'de hatırlatmayı yeniden kur.' }); break; } }
      }
      if (ok) await patch(d, { hj: JSON.stringify(kalan), on: kalan.length > 0, sentAt: now, err: '' });
      continue;
    }
    if (d.page === 'balik') {
      const m = d.sub && d.sub.endpoint ? balikMesaj(d, now) : null;
      if (!m) { skipped++; continue; }
      let res; try { res = await sendPush(d.sub, m.msg, env.VAPID_PRIVATE); } catch (e) { res = { status: 0, text: String(e.message || e) }; }
      console.log(`  ${d._path.split('/').pop().slice(0, 6)}… balik · ${svc(d.sub.endpoint)} → ${res.status}`);
      if (res.status >= 200 && res.status < 300) { sent++; await patch(d, { ...m.upd, sentAt: now, err: '' }); }
      else { failed++; await patch(d, res.status === 404 || res.status === 410 ? { on: false, err: 'Telefon aboneliği artık geçerli değil; Derin Mavi’de bildirimleri yeniden aç.' } : { ...m.upd, err: 'Gönderim hatası ' + res.status }); }
      continue;
    }
    const test = d.test === true, key = force ? 'zorla|' + now.toISOString() : test ? 'test|' + now.toISOString() : dueSlot(d, now), msg0 = key && d.sub && d.sub.endpoint ? message(d, ORN, now) : null;
    const msg = msg0 && test ? { ...msg0, title: '📡 Test · ' + msg0.title } : msg0;
    if (!msg) { skipped++; if (d.sub && d.sub.endpoint) console.log(`  ${d._path.split('/').pop().slice(0, 6)}… ${d.page || 'ingilizce'} · ${svc(d.sub.endpoint)} · sırası gelmedi (${d.from}–${d.to}, ${d.step || 180} dk)`); continue; }
    const upd = {}; let res;
    try { res = await sendPush(d.sub, msg, env.VAPID_PRIVATE); } catch (e) { res = { status: 0, text: String(e.message || e) }; }
    const kim = `${d._path.split('/').pop().slice(0, 6)}… ${d.page || 'ingilizce'} · ${svc(d.sub.endpoint)}${test ? ' · TEST' : ''}`;
    if (test) Object.assign(upd, { test: false, testAt: now, testRes: res.status });
    if (res.status >= 200 && res.status < 300) { sent++; console.log(`  ${kim} → gönderildi (${res.status}) ${key.split('|').pop()}`); Object.assign(upd, test ? { pos: (d.pos || 0) + 1, sentAt: now, err: '' } : { pos: (d.pos || 0) + 1, last: key, sentAt: now, err: '' }); }
    else { failed++; console.log(`  ${kim} → gönderilemedi: ${res.status} ${res.text}`);
      Object.assign(upd, res.status === 404 || res.status === 410 ? { on: false, err: 'Telefon aboneliği artık geçerli değil; sayfadan bildirimleri yeniden aç.' } : test ? { err: 'Gönderim hatası ' + res.status } : { last: key, err: 'Gönderim hatası ' + res.status }); }
    await patch(d, upd);
  }
  console.log(`${docs.length} açık abonelik · ${sent} gönderildi · ${skipped} sırası gelmedi · ${failed} hata${dupes.length ? ' · ' + dupes.length + ' çift kayıt kapatıldı' : ''}`);
  return { docs: docs.length, sent, skipped, failed, dupes: dupes.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error('HATA:', e.message); process.exit(1); });
