/* erdevelop · Eğitimler sayfası üreticisi
   Tools.html'deki eğitim gruplarını (alt başlıklarıyla) okuyup egitimler/index.html sayfasını üretir.
   Tools.html'de bir eğitim eklenince ya da alt başlığı değişince bu sayfa da güncellenir; site-indeks iş akışı her push'ta çalıştırır.
   Elle: node .github/indeks/egitimler.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://erdevelop.github.io/';
const GRUPLAR = ['facadeedu', 'edu', 'code', 'plang', 'lang'];
const KISA = { facadeedu: 'Cephe', edu: 'CAD ve BIM', code: 'Yazılım', plang: 'Programlama dilleri', lang: 'Dil öğrenme' };

const tools = fs.readFileSync(path.join(KOK, 'Tools.html'), 'utf8');
/* Tools.html'deki betikten ICON ve G dizisini çıkar */
const bas = tools.indexOf('(() => {', tools.indexOf('<script>', tools.indexOf('const LB') - 400));
const iconSon = tools.indexOf('const T = {', bas);
const ICON = new Function('document', tools.slice(bas + 8, iconSon) + '; return ICON;')({ getElementById: () => null });
const gBas = tools.indexOf('[', tools.indexOf('const G = [', iconSon));
let d = 0, gSon = gBas, tirnak = null;
for (let i = gBas; i < tools.length; i++) {
  const c = tools[i];
  if (tirnak) { if (c === '\\') { i++; continue; } if (c === tirnak) tirnak = null; continue; }
  if (c === "'" || c === '"' || c === '`') { tirnak = c; continue; }
  if (c === '[' || c === '{') d++; else if (c === ']' || c === '}') { d--; if (d === 0) { gSon = i + 1; break; } }
}
const G = new Function('return ' + tools.slice(gBas, gSon))();
const gruplar = GRUPLAR.map(id => G.find(g => g.id === id)).filter(Boolean);

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
const href = f => '../' + f.replace(/index\.html$/, '');
const anahtar = f => '/' + f.replace(/index\.html$/, '');
const kart = it => `<a class="kart" href="${href(it.f)}" data-k="${esc(anahtar(it.f))}" data-s="${esc(fold(it.t.tr + ' ' + it.t.en + ' ' + (it.d ? it.d.tr : '') + ' ' + it.f))}">
  <span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[it.i] || ''}</svg></span>
  <h4>${esc(it.t.tr)}</h4>
  ${it.d ? `<p>${esc(it.d.tr)}</p>` : ''}
  <span class="alt">${it.tag ? `<b>${esc(it.tag.tr || it.tag)}</b>` : ''}<i class="ilr"></i></span>
</a>`;
const bolum = g => {
  const ic = g.subs
    ? g.subs.map(sb => { const its = g.items.filter(it => it.s === sb.id); return its.length ? `<section class="alt-g"><h3>${esc(sb.tr)} <small>${its.length}</small></h3><div class="izgara">${its.map(kart).join('')}</div></section>` : ''; }).join('')
    : `<div class="izgara">${g.items.map(kart).join('')}</div>`;
  return `<section class="grup" id="${g.id}" data-g="${g.id}"><div class="layer-head"><span class="swatch"></span><h2>${esc(g.h.tr)}</h2><span class="meta">${g.items.length}</span></div>${g.d ? `<p class="gd">${esc(g.d.tr)}</p>` : ''}${ic}</section>`;
};
const toplam = gruplar.reduce((a, g) => a + g.items.length, 0);
const egitimSay = gruplar.reduce((a, g) => a + g.items.filter(it => it.f.startsWith('egitimler/')).length, 0);
const baslik = 'Ücretsiz Eğitimler: Cephe, CAD, BIM, Yazılım ve Programlama | erdevelop';
const aciklama = `${egitimSay} ücretsiz Türkçe eğitim: cephe tasarımı ve statiği, AutoCAD, Revit, Rhino, Grasshopper, SolidWorks, Dynamo, yazılım ve programlama dilleri. 7 günlük programlar, ilerlemen kaydedilir.`;
const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Eğitimler', url: SITE + 'egitimler/', inLanguage: 'tr', description: aciklama,
  mainEntity: { '@type': 'ItemList', numberOfItems: toplam, itemListElement: gruplar.flatMap(g => g.items).map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.t.tr, url: SITE + it.f.replace(/index\.html$/, '') })) } };

const html = `<!doctype html>
<html lang="tr" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/egitimler.mjs). Elle değiştirme; eğitimleri Tools.html'de düzenle. -->
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${SITE}egitimler/">
<meta property="og:type" content="website"><meta property="og:site_name" content="erdevelop"><meta property="og:title" content="${esc(baslik)}"><meta property="og:description" content="${esc(aciklama)}"><meta property="og:url" content="${SITE}egitimler/">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b1220"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="../kesif/tema.css">
<style>
.ara { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 18px 0 6px; }
.ara .inp { flex: 1; min-width: 220px; }
.cips { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 0; }
.cips button { font: 500 12px var(--f-mono); color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.cips button.on { color: var(--on-accent, #fff); background: var(--accent); border-color: var(--accent); }
.say { font: 400 12px var(--f-mono); color: var(--muted); margin-left: auto; }
.grup { margin-top: 34px; }
.gd { color: var(--text); margin: -6px 0 14px; max-width: 80ch; font-size: .95rem; }
.alt-g + .alt-g { margin-top: 20px; }
.alt-g h3 { margin: 4px 0 10px; font: 600 12px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 8px; }
.alt-g h3::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.alt-g h3 small { font-weight: 400; opacity: .7; }
.izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.kart { display: grid; grid-template-columns: 46px 1fr; gap: 4px 12px; align-items: start; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 13px; text-decoration: none; color: var(--fg); transition: border-color .15s, transform .15s; }
.kart:hover { border-color: var(--accent); transform: translateY(-1px); }
.kart .ico { grid-row: span 3; width: 46px; height: 46px; border-radius: 6px; background: var(--panel-2); border: 1px solid var(--line); color: var(--accent); display: grid; place-items: center; }
.kart .ico svg { width: 27px; height: 27px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.kart h4 { margin: 0; font: 600 1rem var(--f-body); }
.kart p { margin: 0; color: var(--text); font-size: .86rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.kart .alt { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 4px; font: 400 11px var(--f-mono); color: var(--muted); }
.kart .alt b { font-weight: 500; color: var(--accent); }
.kart .ilr:empty { display: none; }
.kart .ilr { font-style: normal; color: #2e8b57; font-weight: 600; }
.kart .bar { grid-column: 1 / -1; height: 4px; border-radius: 4px; background: var(--line); overflow: hidden; margin-top: 6px; }
.kart .bar i { display: block; height: 100%; background: #2e8b57; }
#devam[hidden] { display: none; }
.bos { color: var(--muted); padding: 20px 0; }
.doc { max-width: 860px; margin-top: 44px; }
.doc h2 { font: 700 1.2rem/1.3 var(--f-display); color: var(--fg); margin: 0 0 10px; }
.doc h3 { font: 600 1rem/1.4 var(--f-body); color: var(--fg); margin: 18px 0 6px; }
.doc p, .doc li { color: var(--text); line-height: 1.65; }
</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="topbar"><div class="wrap">
  <a class="brand" href="../">erdevelop<span>_</span></a><span class="crumb">/ eğitimler</span><span class="sp"></span>
  <a class="tb" href="../Tools.html">Araçlar</a><button class="tb" type="button" id="modeBtn">LIGHT</button>
</div></div>
<main class="wrap">
  <header class="head"><h1>Eğitimler</h1><p>${egitimSay} ücretsiz Türkçe eğitim: cephe tasarımı, CAD ve BIM programları, yazılım ve programlama dilleri; yanında dil kulüpleri. Çoğu 7 günlük programdır, her günün sonunda alıştırma vardır. İlerlemen bu tarayıcıda, giriş yaptıysan hesabında saklanır.</p></header>
  <div class="ara"><input class="inp" id="q" type="search" placeholder="Eğitim ara… (ör. Revit, cam, Python, statik)" autocomplete="off" aria-label="Eğitim ara"><span class="say" id="say">${toplam} eğitim</span></div>
  <div class="cips" id="cips"><button type="button" class="on" data-g="">Hepsi</button>${gruplar.map(g => `<button type="button" data-g="${g.id}">${esc(KISA[g.id] || g.h.tr)}</button>`).join('')}</div>
  <section class="grup" id="devam" hidden><div class="layer-head"><span class="swatch"></span><h2>Kaldığın yerden devam et</h2><span class="meta" id="devamN"></span></div><div class="izgara" id="devamL"></div></section>
${gruplar.map(bolum).join('\n')}
  <p class="bos" id="bos" hidden>Aramana uyan eğitim yok. Başka bir kelime dene ya da <a href="../Tools.html">tüm araçlara</a> göz at.</p>
  <section class="doc">
    <h2>Eğitimler hakkında</h2>
    <p>Bu sayfadaki eğitimler, cephe tasarımı ve mühendisliğinde, mimari ve mekanik tasarım programlarında ve yazılımda temel bilgiyi adım adım vermek için hazırlandı. Her eğitim şemalar, örnekler ve alıştırmalarla ilerler; hesap gerektirmez.</p>
    <h3>Nasıl ilerlemeliyim?</h3>
    <ul><li>Cepheye yeniyseniz <b>Cephe Tasarımının Temelleri</b> ve <b>Statiğin Temelleri</b> ile başlayın; ardından sistemler ve detay eğitimlerine geçin.</li>
    <li>Çizim programlarında önce <b>Teknik Resim</b>, sonra kullandığınız programın eğitimi (AutoCAD, Revit, Rhino, SolidWorks) iyi bir sıradır.</li>
    <li>Yazılıma yeni başlıyorsanız <b>Programlama Temelleri</b> ve <b>Python</b> en kolay başlangıçtır; tasarım programlarını otomatikleştirmek için AutoLISP, VBA ya da Rhino Python eğitimlerine geçebilirsiniz.</li></ul>
    <p style="font-size:13px;opacity:.75">Eğitimler bilgi ve ön bilgi amaçlıdır; mühendislik hesabı, proje ya da mesleki danışmanlık yerine geçmez. <a href="../kullanim.html">Kullanım şartları</a></p>
  </section>
</main>
<footer><div class="wrap"><span><a href="../hakkinda.html">Hakkında</a> · <a href="../gizlilik.html">Gizlilik</a> · <a href="../kullanim.html">Kullanım şartları</a></span><a href="../Tools.html">← tüm araçlar</a></div></footer>
<script src="../kesif/tema.js"></script>
<script>
(() => {
  const $ = id => document.getElementById(id);
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  let O = {}; try { O = JSON.parse(localStorage.getItem('erdevelop-egitim-ozet') || '{}') || {}; } catch (e) { }
  /* ilerleme: kartlara yüzde ve çubuk */
  document.querySelectorAll('.kart[data-k]').forEach(k => { const e = O[k.dataset.k]; if (!e || !(e.p > 0)) return;
    k.querySelector('.ilr').textContent = e.p >= 100 ? '★ tamamlandı' : '%' + e.p + ' · devam et';
    const b = document.createElement('span'); b.className = 'bar'; b.innerHTML = '<i style="width:' + Math.min(100, e.p) + '%"></i>'; k.appendChild(b); });
  /* kaldığın yerden: yarım kalanlar, en son açılan önce */
  const yarim = Object.entries(O).filter(([, e]) => e && e.p > 0 && e.p < 100).sort((a, b) => (b[1].t || 0) - (a[1].t || 0)).slice(0, 6)
    .map(([k]) => document.querySelector('.grup:not(#devam) .kart[data-k="' + CSS.escape(k) + '"]')).filter(Boolean);
  if (yarim.length) { $('devamL').append(...yarim.map(k => k.cloneNode(true))); $('devamN').textContent = yarim.length; $('devam').hidden = false; }
  /* arama ve grup süzme */
  let grup = '';
  function suz() {
    const qs = fold($('q').value.trim()).split(/\\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('.grup:not(#devam)').forEach(g => { let gn = 0;
      g.querySelectorAll('.kart').forEach(k => { const ok = (!grup || g.dataset.g === grup) && qs.every(w => k.dataset.s.includes(w)); k.hidden = !ok; if (ok) gn++; });
      g.querySelectorAll('.alt-g').forEach(a => { const c = a.querySelectorAll('.kart:not([hidden])').length; a.hidden = !c; a.querySelector('small').textContent = c; });
      g.hidden = !gn; n += gn; });
    $('devam').hidden = !yarim.length || !!qs.length || !!grup;
    $('say').textContent = n + ' eğitim'; $('bos').hidden = !!n;
  }
  $('q').addEventListener('input', suz);
  $('cips').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; grup = b.dataset.g; $('cips').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); suz(); });
  const h = location.hash.slice(1); if (h && document.querySelector('.cips [data-g="' + CSS.escape(h) + '"]')) document.querySelector('.cips [data-g="' + CSS.escape(h) + '"]').click();
})();
</script>
<script>if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { }));</script>
<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(KOK, 'egitimler/index.html'), html);
console.log(`egitimler/index.html: ${gruplar.length} grup, ${toplam} kart (${egitimSay} eğitim)`);
