/* erdevelop · Kategori sayfaları üreticisi
   Tools.html'deki araç gruplarını okuyup her grup için ayrı bir kategori sayfası üretir (ör. /hesaplama-araclari/).
   Tools.html'de bir araç eklenince ya da değişince bu sayfalar da güncellenir; site-indeks iş akışı her push'ta çalıştırır.
   Eğitimler (/egitimler/) ve yapay zekâ (/yapay-zeka/) sayfaları kendi üreticilerinde.
   Elle: node .github/indeks/kategoriler.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://erdevelop.com/';

/* grup → sayfa. Sıra, sayfalar arası gezinme çubuğunun sırasıdır. */
export const KATEGORI = [
  { id: 'calc', yol: 'hesaplama-araclari', kisa: ['Hesaplama', 'Calculators'],
    baslik: ['Ücretsiz Hesaplama Araçları: KDV, Maaş, Kira, Kredi, Faiz', 'Free Calculators: VAT, Salary, Rent, Loan, Interest'],
    aciklama: ['KDV, brüt net maaş, kıdem tazminatı, kira artışı, kredi taksiti, mevduat faizi, yüzde, tarih ve birim hesapları. Ücretsiz, üyeliksiz; her hesabın nasıl yapıldığı da anlatılıyor.', 'VAT, gross-to-net salary, severance, rent increase, loan instalments, deposit interest, percentages, dates and units. Free, no sign-up, with each calculation explained.'],
    yazi: [['Bu sayfadaki hesaplayıcılar günlük hayatta en sık gereken hesapları tek yerde toplar: vergi ve maaş, kira ve kredi, faiz ve birikim, yüzde, tarih ve birim çevirme. Her araç sonucu anında gösterir, altında da hesabın hangi formülle ve hangi güncel parametrelerle yapıldığını anlatır.', 'Vergi oranları, asgari ücret, kıdem tavanı ve TÜFE gibi değerler yıl içinde değişebilir. Sonuçlar ön bilgi amaçlıdır; resmî işlemlerde güncel mevzuatı kontrol et ya da bir mali müşavire danış.'],
      ['These calculators gather the sums people need most often in one place: tax and salary, rent and loans, interest and savings, percentages, dates and unit conversion. Each tool shows the result instantly and explains the formula and current parameters below it. Most of them follow Turkish rules and are in Turkish.', 'Rates such as tax brackets, minimum wage and CPI can change during the year. Results are for information only; check current regulations or ask an accountant for official matters.']] },
  { id: 'facade', yol: 'cephe-hesaplari', kisa: ['Cephe', 'Facade'],
    baslik: ['Cephe Hesapları: Rüzgâr Yükü, Cam, Dikme, Ankraj, Korkuluk', 'Facade Calculations: Wind Load, Glass, Mullions, Anchors'],
    aciklama: ['Cephe ve cam için ücretsiz ön boyutlandırma araçları: rüzgâr yükü, cam ağırlığı ve kalınlığı, dikme sehimi, ankraj, korkuluk camı, ısıl genleşme, yoğuşma ve U değeri. Eğitim ve ön bilgi amaçlıdır.', 'Free preliminary sizing tools for facades and glass: wind load, glass weight and thickness, mullion deflection, anchors, balustrade glass, thermal expansion, condensation and U-values. For learning and early estimates.'],
    yazi: [['Cephe tasarımının erken aşamasında hızlıca fikir edinmek için hazırlanmış hesaplar: rüzgâr ve kar yükü, cam dizilimi ve ağırlığı, cam kalınlığı, dikme ve kiriş sehimi, ankraj ve dübel kapasitesi, silikon derzi, ısıl genleşme, yoğuşma ve ısı geçirgenliği. Cephe Ön Hesap Raporu bunların çoğunu tek sayfada toplayıp PDF olarak verir.', 'Bu araçlar eğitim ve ön boyutlandırma amaçlıdır; statik proje, tip testi ya da yetkin bir mühendisin hesabı yerine geçmez. Uygulama kararlarını yürürlükteki standartlara göre yapılmış proje hesabıyla ver.'],
      ['Calculations for getting a quick feel in the early stage of facade design: wind and snow load, glass make-up and weight, glass thickness, mullion and transom deflection, anchor and dowel capacity, structural silicone joints, thermal expansion, condensation and thermal transmittance. The Facade Pre-Design Report collects most of them on one page as a PDF.', 'These tools are for learning and preliminary sizing only; they do not replace structural design, type testing or a qualified engineer. Base construction decisions on project calculations made to the applicable standards.']] },
  { id: 'docs', yol: 'belge-araclari', kisa: ['Belge ve dosya', 'Files'],
    baslik: ['PDF ve Belge Araçları: Birleştir, Böl, Sıkıştır, Dönüştür', 'PDF & Document Tools: Merge, Split, Compress, Convert'],
    aciklama: ['PDF birleştirme, bölme, sıkıştırma, imza ve şifre; resim düzenleme, dosya dönüştürme ve görüntüleme, kelime sayacı ve metin karşılaştırma. Dosyaların tarayıcında işlenir, bir sunucuya yüklenmez.', 'Merge, split, compress, sign and protect PDFs; edit images, convert and view files, count words and compare texts. Files are processed in your browser and never uploaded.'],
    yazi: [['Belge araçları işi tamamen tarayıcında yapar: PDF dosyalarını birleştirir, böler, sıkıştırır, imza ve filigran ekler, şifreler; resimleri düzenler, dosya biçimlerini dönüştürür ve açar; metindeki kelimeleri sayar, iki metni karşılaştırır. Dosyaların cihazından çıkmadığı için gizli belgelerle de güvenle kullanabilirsin.'],
      ['The document tools do all the work in your browser: merge, split and compress PDFs, add signatures, watermarks and passwords, edit images, convert and open files, count words and compare two texts. Because your files never leave your device, you can use them with confidential documents too.']] },
  { id: 'dev', yol: 'gelistirici-araclari', kisa: ['Geliştirici', 'Developer'],
    baslik: ['Geliştirici Araçları: JSON, Base64, Regex, Hash, UUID, Konsol', 'Developer Tools: JSON, Base64, Regex, Hash, UUID, Console'],
    aciklama: ['JSON biçimlendirici, Base64 çevirici, regex deneme, hash, UUID ve şifre üretici, zaman damgası çevirici, tarayıcıda terminal ve ağ analizi. Ücretsiz, kurulumsuz, verilerin cihazında kalır.', 'JSON formatter, Base64 converter, regex tester, hashes, UUID and password generators, timestamp converter, an in-browser terminal and a network check. Free, nothing to install, your data stays on your device.'],
    yazi: [['Yazılımcıların gün içinde sık açtığı küçük yardımcılar tek sayfada: JSON’u düzenle ve doğrula, Base64 ve URL kodla ya da çöz, düzenli ifadeyi örnek metin üzerinde dene, hash ve UUID üret, Unix zamanını okunur tarihe çevir. Konsol sayfası tarayıcıda ping, dig, whois gibi komutlar ve öykünücüde çalışan gerçek bir Linux sunar.', 'Araçların hepsi tarayıcında çalışır; yapıştırdığın veri, anahtar ya da metin bir sunucuya gönderilmez.'],
      ['The small helpers developers open many times a day, on one page: format and validate JSON, encode or decode Base64 and URLs, test a regular expression against sample text, generate hashes and UUIDs, turn Unix time into a readable date. The Console page offers commands like ping, dig and whois in the browser, plus a real Linux running in an emulator.', 'Everything runs in your browser; the data, keys or text you paste are not sent to a server.']] },
  { id: 'cad', yol: 'cad-komutlari', kisa: ['CAD komutları', 'CAD commands'],
    baslik: ['CAD Komutları ve Kısayolları: AutoCAD, Revit, Rhino, SolidWorks', 'CAD Commands & Shortcuts: AutoCAD, Revit, Rhino, SolidWorks'],
    aciklama: ['AutoCAD, Revit, Rhino, Grasshopper, SolidWorks, CATIA, SketchUp, Navisworks ve diğer programların komutları ve klavye kısayolları; Türkçe açıklamalı, aranabilir listeler.', 'Commands and keyboard shortcuts for AutoCAD, Revit, Rhino, Grasshopper, SolidWorks, CATIA, SketchUp, Navisworks and more, in searchable lists with Turkish descriptions.'],
    yazi: [['Çizim ve modelleme programlarında en çok kullanılan komutları ve kısayolları program program listeler. Her listede arama vardır; komutun ne işe yaradığı kısaca Türkçe anlatılır. Tüm programlarda birden aramak için ilk karttaki ortak arama sayfasını kullan.'],
      ['Lists the most used commands and shortcuts in drawing and modelling programs, one program at a time. Every list is searchable and each command has a short description in Turkish. Use the first card to search all programs at once.']] },
  { id: 'tech', yol: 'tasarim-araclari', kisa: ['Tasarım', 'Design'],
    baslik: ['Tasarım Araçları: DXF Görüntüleyici, RAL Kartelası, Merdiven ve Beton Hesabı', 'Design Tools: DXF Viewer, RAL Colours, Stairs and Concrete'],
    aciklama: ['Tarayıcıda DXF açma, RAL kartelası ve kameradan RAL bulma, mini Grasshopper, merdiven, beton ve duvar hesabı, saha koordinatı ve güneş yolu. Ücretsiz ve kurulumsuz.', 'Open DXF files in the browser, a RAL chart and RAL finder from the camera, a mini Grasshopper, stair, concrete and wall calculators, site coordinates and sun path. Free, nothing to install.'],
    yazi: [['Mimarlık, cephe ve imalat tasarımında işe yarayan küçük araçlar: CAD programı olmadan DXF çizimini aç, RAL kodunun rengini bul ya da kameradan yakala, tarayıcıda parametrik model kur, merdiven ölçülerini ve beton-duvar malzemesini hesapla, sahanın koordinatını ve güneş yolunu gör. Hepsi telefonda da açılır.'],
      ['Small tools for architecture, facade and fabrication design: open a DXF drawing without a CAD program, find a RAL colour or pick it up with the camera, build a parametric model in the browser, work out stair dimensions and concrete or wall materials, and see a site’s coordinates and sun path. All of them work on a phone too.']] },
  { id: 'device', yol: 'telefon-araclari', kisa: ['Telefon', 'Phone'],
    baslik: ['Telefon Araçları: Fener, Su Terazisi, Ses Ölçer, QR Okuyucu', 'Phone Tools: Torch, Spirit Level, Sound Meter, QR Scanner'],
    aciklama: ['Telefonun fenerini, mikrofonunu, sensörlerini ve kamerasını kullanan ücretsiz araçlar: fener, su terazisi, pusula, ses ölçer ve ses analizi, ekran ve ses kaydı, QR ve barkod okuma. Uygulama indirmeden tarayıcıda çalışır.', 'Free tools that use your phone’s torch, microphone, sensors and camera: torch, spirit level, compass, sound meter and analysis, screen and audio recording, QR and barcode scanning. They run in the browser, no app to install.'],
    yazi: [['Bu araçlar telefonunun donanımını doğrudan tarayıcıdan kullanır; ayrı bir uygulama yüklemen gerekmez. İlk açılışta tarayıcı mikrofon, kamera ya da hareket sensörü için izin ister. Ses ve görüntü cihazında işlenir, kaydedilmez ve gönderilmez.'],
      ['These tools use your phone’s hardware straight from the browser, with no separate app to install. On first use the browser asks for permission to use the microphone, camera or motion sensors. Sound and video are processed on your device; nothing is recorded or sent.']] },
  { id: 'daily', yol: 'gunluk-araclar', kisa: ['Günlük', 'Everyday'],
    baslik: ['Günlük Araçlar: Hava Durumu, Deprem, Plan ve Fikir Tahtası', 'Everyday Tools: Weather, Earthquakes, Planning Boards'],
    aciklama: ['Hava durumu ve son depremler, kitap listeleri, plan ve fikir tahtaları gibi gündelik işler için ücretsiz araçlar.', 'Free tools for everyday things: weather, recent earthquakes, book lists, planning and idea boards.'],
    yazi: [['Gün içinde ihtiyaç duyabileceğin pratik sayfalar: bulunduğun yerin hava durumu ve saatlik tahmini, Türkiye ve dünyadaki son depremler, okuma listeleri, yapılacaklar ve fikirler için tahtalar.'],
      ['Practical pages you may need during the day: the weather and hourly forecast where you are, recent earthquakes in Turkey and worldwide, reading lists, and boards for to-dos and ideas.']] },
  { id: 'games', yol: 'tarayici-oyunlari', kisa: ['Oyunlar', 'Games'],
    baslik: ['Ücretsiz Tarayıcı Oyunları: Strateji, Kart, Hayatta Kalma', 'Free Browser Games: Strategy, Cards, Survival'],
    aciklama: ['İndirmeden oynanan ücretsiz oyunlar: Küçük Krallık, Krallık Kartları, Organizma serisi, Kozmos, Derin Mavi, bilgi yarışması, sudoku ve daha fazlası. Telefonda da çalışır.', 'Free games you play without downloading: Little Kingdom, Kingdom Cards, the Organism series, Kozmos, Deep Blue, a trivia quiz, sudoku and more. They work on phones too.'],
    yazi: [['Tarayıcıda açılıp hemen oynanan oyunlar: sakin bir köy stratejisi, kart savaşı, tek hücreden şehre uzanan Organizma serisi, uzayda keşif, okyanusta bir balığı büyütme, günlük bulmacalar ve bilgi yarışması. İlerlemen bu tarayıcıda saklanır; üyelik gerekmez.', 'Onlarca kısa mini oyun için Oyun Bahçesi’ne de göz at.'],
      ['Games that open in the browser and play straight away: a calm village strategy, a card battle, the Organism series from a single cell to a city, space exploration, raising a fish in the ocean, daily puzzles and a trivia quiz. Progress is saved in this browser; no account needed.', 'For dozens of short mini games, have a look at the Game Garden too.']] },
];

const tools = fs.readFileSync(path.join(KOK, 'Tools.html'), 'utf8');
/* Tools.html'deki betikten ICON ve G dizisini çıkar (egitimler.mjs ile aynı yöntem) */
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

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
const href = f => '../' + f.replace(/(^|\/)index\.html(?=$|#)/, '$1');
const tag = t => (t && typeof t === 'object') ? t : (t ? { tr: t, en: t } : null);
const en = (o, k = 'en') => (o && o[k]) || '';

const kart = it => {
  const tg = tag(it.tag);
  return `<a class="kart" href="${esc(href(it.f))}" data-s="${esc(fold(it.t.tr + ' ' + en(it.t) + ' ' + (it.d ? it.d.tr + ' ' + en(it.d) : '') + ' ' + it.f))}">
  <span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[it.i] || ''}</svg></span>
  <h3${en(it.t) && en(it.t) !== it.t.tr ? ` data-en="${esc(en(it.t))}"` : ''}>${esc(it.t.tr)}</h3>
  ${it.d ? `<p${en(it.d) ? ` data-en="${esc(en(it.d))}"` : ''}>${esc(it.d.tr)}</p>` : ''}
  ${tg ? `<span class="alt"><b data-en="${esc(tg.en)}">${esc(tg.tr)}</b></span>` : ''}
</a>`;
};

const nav = aktif => `<nav class="katnav" aria-label="Kategoriler" data-en-aria="Categories">${KATEGORI.map(k => `<a href="../${k.yol}/"${k.id === aktif ? ' class="on" aria-current="page"' : ''} data-en="${esc(k.kisa[1])}">${esc(k.kisa[0])}</a>`).join('')}<a href="../egitimler/" data-en="Courses">Eğitimler</a><a href="../yapay-zeka/" data-en="AI">Yapay zekâ</a><a href="../Tools.html" data-en="All tools">Tümü</a></nav>`;

const sayfa = k => {
  const g = G.find(x => x.id === k.id);
  if (!g) { console.warn('grup yok:', k.id); return null; }
  const items = g.items;
  const url = SITE + k.yol + '/';
  const baslik = `${k.baslik[0]} | erdevelop`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: g.h.tr, url, inLanguage: 'tr', description: k.aciklama[0],
    isPartOf: { '@type': 'WebSite', name: 'erdevelop', url: SITE },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'erdevelop', item: SITE }, { '@type': 'ListItem', position: 2, name: g.h.tr, item: url }] },
    mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.t.tr, url: SITE + it.f.replace(/(^|\/)index\.html(?=$|#)/, '$1') })) } };
  const ekLink = k.id === 'games' ? `<p><a href="../oyunlar/" data-en="Open the Game Garden →">Oyun Bahçesi’ni aç →</a></p>` : '';
  return `<!doctype html>
<html lang="tr" data-mode="dark">
<head>
<meta charset="utf-8">
<script src="/dil.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/kategoriler.mjs). Elle değiştirme; araçları Tools.html'de, sayfa metnini üreticide düzenle. -->
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(k.aciklama[0])}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="erdevelop"><meta property="og:title" content="${esc(baslik)}"><meta property="og:description" content="${esc(k.aciklama[0])}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}og/Tools.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b1220"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="../kesif/tema.css">
<style>
.katnav { display: flex; gap: 6px; flex-wrap: wrap; margin: 18px 0 4px; }
.katnav a { font: 500 12px var(--f-mono); color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; text-decoration: none; }
.katnav a:hover { border-color: var(--accent); color: var(--fg); }
.katnav a.on { color: var(--on-accent, #fff); background: var(--accent); border-color: var(--accent); }
.ara { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 16px 0 18px; }
.ara .inp { flex: 1; min-width: 220px; }
.say { font: 400 12px var(--f-mono); color: var(--muted); margin-left: auto; }
.izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.kart { display: grid; grid-template-columns: 46px 1fr; gap: 4px 12px; align-items: start; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 13px; text-decoration: none; color: var(--fg); transition: border-color .15s, transform .15s; }
.kart:hover { border-color: var(--accent); transform: translateY(-1px); }
.kart .ico { grid-row: span 3; width: 46px; height: 46px; border-radius: 6px; background: var(--panel-2); border: 1px solid var(--line); color: var(--accent); display: grid; place-items: center; }
.kart .ico svg { width: 27px; height: 27px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.kart h3 { margin: 0; font: 600 1rem var(--f-body); }
.kart p { margin: 0; color: var(--text); font-size: .86rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.kart .alt { font: 400 11px var(--f-mono); margin-top: 4px; }
.kart .alt b { font-weight: 500; color: var(--accent); }
.bos { color: var(--muted); padding: 20px 0; }
.doc { max-width: 860px; margin-top: 40px; }
.doc h2 { font: 700 1.2rem/1.3 var(--f-display); color: var(--fg); margin: 0 0 10px; }
.doc p { color: var(--text); line-height: 1.65; }
</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="topbar"><div class="wrap">
  <a class="brand" href="../">erdevelop<span>_</span></a><span class="crumb">/ ${esc(k.kisa[0].toLocaleLowerCase('tr'))}</span><span class="sp"></span>
  <a class="tb" href="../Tools.html" data-en="Tools">Araçlar</a><button class="tb" type="button" data-dil-btn>EN</button><button class="tb" type="button" id="modeBtn">LIGHT</button>
</div></div>
<main class="wrap">
  <header class="head"><h1 data-en="${esc(g.h.en)}">${esc(g.h.tr)}</h1><p data-en="${esc(k.aciklama[1])}">${esc(k.aciklama[0])}</p></header>
  ${nav(k.id)}
  <div class="ara"><input class="inp" id="q" type="search" placeholder="Bu kategoride ara…" data-en-ph="Search this category…" autocomplete="off" aria-label="Bu kategoride ara" data-en-aria="Search this category"><span class="say" id="say">${items.length}</span></div>
  <div class="izgara" id="liste">
${items.map(kart).join('\n')}
  </div>
  <p class="bos" id="bos" hidden><span data-en="Nothing here matches your search.">Aramana uyan araç yok.</span> <a href="../Tools.html" data-en="Search all tools">Tüm araçlarda ara</a></p>
  <section class="doc" data-l="tr"><h2>${esc(g.h.tr)} hakkında</h2>${k.yazi[0].map(p => `<p>${esc(p)}</p>`).join('')}${ekLink}</section>
  <section class="doc" data-l="en" hidden><h2>About ${esc(g.h.en.toLowerCase())}</h2>${k.yazi[1].map(p => `<p>${esc(p)}</p>`).join('')}${ekLink}</section>
</main>
<footer><div class="wrap"><span><a href="../hakkinda.html" data-en="About">Hakkında</a> · <a href="../gizlilik.html" data-en="Privacy">Gizlilik</a> · <a href="../kullanim.html" data-en="Terms">Kullanım şartları</a></span><a href="../Tools.html" data-en="← all tools">← tüm araçlar</a></div></footer>
<script src="../kesif/tema.js"></script>
<script>
(() => {
  const $ = id => document.getElementById(id);
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  $('q').addEventListener('input', () => {
    const qs = fold($('q').value.trim()).split(/\\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('#liste .kart').forEach(k => { const ok = qs.every(w => k.dataset.s.includes(w)); k.hidden = !ok; if (ok) n++; });
    $('say').textContent = n; $('bos').hidden = !!n;
  });
})();
</script>
<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
};

let n = 0;
for (const k of KATEGORI) {
  const html = sayfa(k); if (!html) continue;
  fs.mkdirSync(path.join(KOK, k.yol), { recursive: true });
  fs.writeFileSync(path.join(KOK, k.yol, 'index.html'), html); n++;
}
console.log(`kategori sayfaları: ${n}`);
