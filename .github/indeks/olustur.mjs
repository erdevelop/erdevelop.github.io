// erdevelop · arama dizini, yenilikler listesi ve RSS beslemesi üretir.
// Çalıştırma (depo kökünde): node .github/indeks/olustur.mjs
// Çıktılar: arama.json, yenilikler.json, feed.xml
// GitHub Actions her push'tan sonra çalıştırır (.github/workflows/site-indeks.yml).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const SITE = 'https://erdevelop.com';
const ROOT = process.cwd();
const ATLA = /^(\.|node_modules|araclar\/lib|oyunlar\/games|apps\/.*\/assets)|google[0-9a-f]+\.html$|^404\.html$|^privacyPolicy/;

const dosyalar = [];
(function gez(d) {
  for (const n of readdirSync(join(ROOT, d))) {
    const p = d ? d + '/' + n : n;
    if (ATLA.test(p)) continue;
    const st = statSync(join(ROOT, p));
    if (st.isDirectory()) gez(p); else if (/\.html$/i.test(n)) dosyalar.push(p);
  }
})('');

const ent = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ');
const tagsiz = s => ent(String(s || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const meta = (h, n) => { const m = h.match(new RegExp(`<meta[^>]+name=["']${n}["'][^>]*content=["']([^"']*)`, 'i')) || h.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${n}["']`, 'i')); return m ? tagsiz(m[1]) : ''; };
const kisa = t => t.replace(/\s*[|·]\s*erdevelop.*$/i, '').replace(/\s+[–—-]\s+erdevelop.*$/i, '').trim();
const urlOf = p => '/' + p.replace(/(^|\/)index\.html$/, '$1');

function tur(p) {
  if (/^yapay-zek[ai]\/|^egitimler\/(yapay-zeka|makine-ogrenmesi)|^ogrenme_labaratuvari\/|^araclar\/(arka-plan-silme|ses-yazi|ocr|belge-ara|kisisel-veri-maskele|token-sayaci|cevirmen|ozetleyici|istem-kutuphanesi)\./.test(p)) return 'Yapay zekâ';
  if (/^rehber\//.test(p)) return 'Rehber';
  if (/^egitimler\//.test(p)) return 'Eğitim';
  if (/^kesif\//.test(p)) return 'Cephe';
  if (/^komutlar\//.test(p)) return 'Komutlar';
  if (/^hesapla\//.test(p)) return 'Hesaplama';
  if (/^araclar\//.test(p)) return 'Araç';
  if (/^(ingilizce|fransizca|almanca)\.html$/.test(p)) return 'Dil kulübü';
  if (/^oyunlar\/|^2048\/|GameKingdom|^three\.html/.test(p)) return 'Oyun';
  if (/^(hakkinda|gizlilik|kullanim|hesap|index|Tools)\.html$/.test(p)) return 'Site';
  return 'Araç';
}

const sayfalar = {};
const kayitlar = [];
for (const p of dosyalar.sort()) {
  let h; try { h = readFileSync(join(ROOT, p), 'utf8'); } catch (e) { continue; }
  if (/http-equiv=["']refresh/i.test(h) && h.length < 3000) continue;
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h)) continue;
  const t = kisa(tagsiz((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]));
  if (!t) continue;
  const h1 = tagsiz((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  let d = meta(h, 'description'); if (d.length > 220) d = d.slice(0, 217).replace(/\s+\S*$/, '') + '…';
  const k = meta(h, 'keywords');
  const lang = (h.match(/<html[^>]+lang=["']([a-z-]+)/i) || [])[1] || 'tr';
  const h1t = h1.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  const r = { t: h1t && h1t.length < 60 && h1t.length > 2 ? h1t : t.split(/\s[–—]\s/)[0], d, u: urlOf(p), c: tur(p) };
  if (r.t.toLocaleLowerCase('tr') !== t.toLocaleLowerCase('tr')) r.a = t;          /* sayfa başlığı farklıysa onu da ara */
  if (k) r.k = k.slice(0, 200);
  if (lang !== 'tr') r.l = lang;
  sayfalar[p] = r; kayitlar.push(r);
}

/* Oyun Bahçesi oyunları ayrı ayrı */
try {
  for (const n of readdirSync(join(ROOT, 'oyunlar/games'))) {
    const s = readFileSync(join(ROOT, 'oyunlar/games', n), 'utf8');
    for (const m of s.matchAll(/id:'([a-z0-9]+)',\s*title:'([^']+)'(?:,\s*category:'([^']*)')?(?:,\s*tags:'([^']*)')?/g))
      kayitlar.push({ t: m[2], d: 'Oyun Bahçesi' + (m[3] ? ' · ' + m[3] : '') + ' — tarayıcıda oynanır.', u: '/oyunlar/#o/' + m[1], c: 'Oyun', k: m[4] || '' });
  }
} catch (e) { }

/* Cephe ve BIM sözlüğü: her terim ayrı kayıt (terim, İngilizcesi, Almancası, tanım) */
try {
  const s = readFileSync(join(ROOT, 'egitimler/sozluk/index.html'), 'utf8');
  for (const m of s.matchAll(/<article class="terim" id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)) {
    const b = m[2], g = rx => tagsiz((b.match(rx) || [])[1]);
    const tr = g(/class="cp"[^>]*>([\s\S]*?)<\/a>/), en = g(/<p class="en">([\s\S]*?)<\/p>/), de = g(/<p class="de"[^>]*>(?:<span>DE<\/span>)?([\s\S]*?)<\/p>/), tn = g(/<p class="tn">([\s\S]*?)<\/p>/);
    if (tr) kayitlar.push({ t: tr, d: (en ? en + ' — ' : '') + tn, u: '/egitimler/sozluk/#' + m[1], c: 'Terim', k: [en, de].filter(Boolean).join(' ') });
  }
} catch (e) { }

/* Yapay zekâ terimleri (yapay-zeka/index.html) */
try {
  const s = readFileSync(join(ROOT, 'yapay-zeka/index.html'), 'utf8');
  for (const m of s.matchAll(/<div class="terim" id="([^"]+)"><dt>([\s\S]*?)<i>([\s\S]*?)<\/i><\/dt><dd>([\s\S]*?)<\/dd><\/div>/g)) {
    const tr = tagsiz(m[2]), en = tagsiz(m[3]);
    kayitlar.push({ t: tr, d: en + ' — ' + tagsiz(m[4]), u: '/yapay-zeka/#' + m[1], c: 'Yapay zekâ', k: en + ' yapay zeka ai' });
  }
} catch (e) { }

/* Konsol komutları: en çok aranacaklar */
for (const [ad, d] of [['linux', 'Tarayıcıda gerçek Linux'], ['ubuntu', 'Tarayıcıda Ubuntu, python3, gcc'], ['windows', 'Tarayıcıda ReactOS (Windows benzeri)'], ['dos', 'Tarayıcıda Türkçe FreeDOS'], ['python', 'Tarayıcıda Python'], ['ping', 'Ping, dig, whois, hız testi']])
  kayitlar.push({ t: 'Konsol: ' + ad, d, u: '/araclar/konsol.html', c: 'Araç', k: 'terminal komut ' + ad });

writeFileSync(join(ROOT, 'arama.json'), JSON.stringify({ v: 1, n: kayitlar.length, s: kayitlar }));

/* ---------------- yenilikler (git geçmişinden) ---------------- */
let log = '';
try { log = execFileSync('git', ['log', '-n', '600', '--no-merges', '--date=short', '--name-status', '--format=@@%H|%ad|%s'], { cwd: ROOT, maxBuffer: 64 << 20 }).toString(); } catch (e) { }
const KOT = /^(update|updates|fix|fixing|fixed|adding|added|new|wip|test|sitemap|merge|revert|update and|minor|chore|\S+\.(html|js|css|mjs|json))\b/i;
const commits = log.split('@@').filter(Boolean).map(b => {
  const [bas, ...satir] = b.trim().split('\n'); const [h, d, ...s] = bas.split('|');
  const ekl = [], deg = [];
  for (const l of satir) { const m = l.match(/^([AMRDC])\d*\t(?:\S+\t)?(.+)$/); if (!m) continue; const f = m[2].trim(); if (!/\.html$/.test(f)) continue; (m[1] === 'A' ? ekl : deg).push(f); }
  return { h, d, s: s.join('|').trim(), ekl, deg };
});
const gor = new Set(), yen = [];
const bul = f => sayfalar[f] || null;
for (const c of commits) {
  if (/^Merge|arama dizini|yenilikler listesi/i.test(c.s)) continue;
  if (/^Programlarım sayfası/i.test(c.s)) continue; /* kaldırılan sayfa */
  const iyi = c.s.length >= 22 && !KOT.test(c.s);
  /* yeni sayfalar: eğitim klasörü bir kez */
  const yeniler = [...new Set(c.ekl.map(f => /^egitimler\/[^/]+\//.test(f) ? f.replace(/^(egitimler\/[^/]+)\/.*$/, '$1/index.html') : f))].map(bul).filter(Boolean);
  if (iyi) {
    const genel = f => /^(Tools|index|404)\.html$/.test(f);
    const ek = c.ekl.filter(f => !genel(f) && bul(f)), dg = c.deg.filter(f => !genel(f) && bul(f));
    const hedef = ek.length ? bul(ek[0]) : dg.length && dg.length <= 6 ? bul(dg[0]) : null;
    const k = c.d + c.s; if (gor.has(k)) continue; gor.add(k);
    yen.push({ d: c.d, t: c.s, u: hedef ? hedef.u : '/', k: yeniler.length ? 'yeni' : 'guncel', h: c.h.slice(0, 7) });
  } else {
    for (const s of yeniler) { const k = 'Y' + s.u; if (gor.has(k)) continue; gor.add(k); yen.push({ d: c.d, t: 'Yeni: ' + s.t, u: s.u, k: 'yeni', h: c.h.slice(0, 7), x: s.d }); }
  }
  if (yen.length >= 200) break;
}
writeFileSync(join(ROOT, 'yenilikler.json'), JSON.stringify({ v: 1, s: yen }));

/* ---------------- RSS ---------------- */
const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc = d => new Date(d + 'T12:00:00+03:00').toUTCString();
const items = yen.slice(0, 50).map(e => `  <item>
    <title>${x(e.t)}</title>
    <link>${SITE}${x(e.u)}</link>
    <guid isPermaLink="false">erdevelop-${e.h}-${x(e.u)}</guid>
    <pubDate>${rfc(e.d)}</pubDate>
    <category>${e.k === 'yeni' ? 'Yeni' : 'Güncelleme'}</category>${e.x ? `\n    <description>${x(e.x)}</description>` : ''}
  </item>`).join('\n');
writeFileSync(join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>erdevelop · Yenilikler</title>
  <link>${SITE}/yenilikler.html</link>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>erdevelop.com'ya eklenen yeni araçlar, eğitimler, oyunlar ve güncellemeler.</description>
  <language>tr</language>
  <lastBuildDate>${yen[0] ? rfc(yen[0].d) : new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>
`);
console.log(`arama.json: ${kayitlar.length} kayıt · yenilikler.json: ${yen.length} · feed.xml: ${Math.min(50, yen.length)}`);
