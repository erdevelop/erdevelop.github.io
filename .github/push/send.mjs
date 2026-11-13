/* İngilizce Kulübü · kelime bildirimi göndericisi
   GitHub Actions her 15 dakikada bir çalıştırır. Firestore'daki push/{uid} kayıtlarına bakar,
   saati gelen kullanıcıya kuyruğundaki sıradaki kelimeyi Web Push ile gönderir.
   Ek paket kullanmaz: şifreleme (RFC 8291), VAPID (RFC 8292) ve Firestore REST, Node'un kendi modülleriyle.

   Gerekli gizli değişkenler (GitHub → Settings → Secrets and variables → Actions):
     FIREBASE_SA    Firebase hizmet hesabı JSON dosyasının tüm içeriği
     VAPID_PRIVATE  VAPID özel anahtarı (base64url, 43 karakter)
   İsteğe bağlı: FORCE=true → saate bakmadan herkese bir kelime gönderir (deneme için). */
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const VAPID_PUBLIC = 'BGPY6KZFQc8GQbAQQiw-0CBI8X6mrn9VHS7yC8fU8Lbw3Ep5H1OyBLXl6ADn_vGn2fp6F64JL1cMdIFhooZM_BQ';
const SUBJECT = process.env.VAPID_SUBJECT || 'https://erdevelop.github.io';
const SITE = 'https://erdevelop.github.io/ingilizce.html';
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
    TTL: '3600', Urgency: 'normal', Topic: 'eng-kelime' } });
  return { status: r.status, text: r.ok ? '' : (await r.text()).slice(0, 300) };
}

/* ---------- zamanlama ---------- */
export function localNow(tz, now = new Date()) {
  let p; try { p = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now); }
  catch (e) { return localNow('Europe/Istanbul', now); }
  const g = t => p.find(x => x.type === t).value; return { date: `${g('year')}-${g('month')}-${g('day')}`, min: +g('hour') * 60 + +g('minute') };
}
const toMin = s => { const [h, m] = String(s || '').split(':').map(Number); return h * 60 + (m || 0); };
/* saati gelmiş ve henüz gönderilmemiş en son bildirim anı; yoksa null. win: GitHub zamanlayıcısının gecikme payı (dk) */
export function dueSlot(d, now = new Date(), win = 50) {
  const { date, min } = localNow(d.tz, now); let a = toMin(d.from), b = toMin(d.to); const st = Math.max(15, +d.step || 180);
  if (!(a >= 0 && b >= 0)) return null; if (b < a) [a, b] = [b, a];
  let best = null; for (let s = a; s <= b; s += st) if (s <= min && min - s < win) best = s;
  if (best == null) return null; const key = date + '|' + best; return key === d.last ? null : key;
}
export function message(d) {
  const q = d.q || []; if (!q.length) return null; const w = q[(d.pos || 0) % q.length];
  return { title: '📚 ' + w.e + (d.mean !== false ? ' — ' + w.t : ''), body: d.mean !== false ? (w.x || 'Dokun, kartı aç.') : 'Anlamını hatırlıyor musun? Dokun ve kontrol et.',
    url: SITE + '?k=' + encodeURIComponent(w.e) + '#kelime', tag: 'eng-kelime' };
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

export async function main(env = process.env) {
  if (!env.FIREBASE_SA || !env.VAPID_PRIVATE) throw new Error('FIREBASE_SA ve VAPID_PRIVATE gizli değişkenleri tanımlı değil.');
  const sa = JSON.parse(env.FIREBASE_SA), base = (env.FIRESTORE_BASE || 'https://firestore.googleapis.com/v1') + `/projects/${sa.project_id}/databases/(default)/documents`;
  const auth = { Authorization: 'Bearer ' + await token(sa) }, force = env.FORCE === 'true', now = new Date();
  const r = await fetch(base + ':runQuery', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'push' }], where: { fieldFilter: { field: { fieldPath: 'on' }, op: 'EQUAL', value: { booleanValue: true } } } } }) });
  if (!r.ok) throw new Error('Firestore okunamadı: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const docs = (await r.json()).filter(x => x.document).map(x => ({ name: x.document.name, ...fromFields(x.document.fields || {}) }));
  let sent = 0, skipped = 0, failed = 0;
  for (const d of docs) {
    const key = force ? 'zorla|' + now.toISOString() : dueSlot(d, now), msg = key && d.sub && d.sub.endpoint ? message(d) : null;
    if (!msg) { skipped++; continue; }
    const upd = {}; let res;
    try { res = await sendPush(d.sub, msg, env.VAPID_PRIVATE); } catch (e) { res = { status: 0, text: String(e.message || e) }; }
    if (res.status >= 200 && res.status < 300) { sent++; Object.assign(upd, { pos: (d.pos || 0) + 1, last: key, sentAt: now, err: '' }); }
    else { failed++; console.log(`  ${d.name.split('/').pop().slice(0, 6)}… gönderilemedi: ${res.status} ${res.text}`);
      Object.assign(upd, res.status === 404 || res.status === 410 ? { on: false, err: 'Telefon aboneliği artık geçerli değil; sayfadan bildirimleri yeniden aç.' } : { last: key, err: 'Gönderim hatası ' + res.status }); }
    const mask = Object.keys(upd).map(k => 'updateMask.fieldPaths=' + k).join('&');
    const p = await fetch(`${env.FIRESTORE_BASE ? base + '/' + d.name.split('/documents/')[1] : 'https://firestore.googleapis.com/v1/' + d.name}?${mask}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(upd).map(([k, v]) => [k, toValue(v)])) }) });
    if (!p.ok) console.log('  kayıt güncellenemedi: ' + p.status);
  }
  console.log(`${docs.length} açık abonelik · ${sent} gönderildi · ${skipped} sırası gelmedi · ${failed} hata`);
  return { docs: docs.length, sent, skipped, failed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error('HATA:', e.message); process.exit(1); });
