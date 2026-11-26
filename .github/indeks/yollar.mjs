/* erdevelop · Öğrenme yolları sayfası üreticisi
   Eğitimleri meslek ve hedefe göre sıralı yollar hâlinde gösteren egitimler/yollar/index.html sayfasını üretir.
   Eğitim adları, simgeleri ve açıklamaları Tools.html'den okunur; yolların sırası aşağıdaki YOLLAR listesindedir.
   egitimler.mjs bu dosyayı çağırır; elle: node .github/indeks/yollar.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://erdevelop.com/';

/* s: eğitim klasörü, x: seçmeli (true), n: kısa not */
const YOLLAR = [
  { id: 'cephe-tasarimcisi', ad: 'Cephe tasarımcısı', ozet: 'Sıfırdan başlayıp cephe sistemlerini, detayları ve imalat projelerini çizebilir hâle gelmek.',
    kim: 'Cepheye yeni başlayan mimar, mühendis, teknik ressam ve tasarımcılar.',
    adim: [
      { s: 'teknik-resim', n: 'Çizim dilinin temeli' },
      { s: 'cephe-temelleri', n: 'Sistemler ve kavramlar' },
      { s: 'cephe-malzemeleri' },
      { s: 'aluminyum-profil' },
      { s: 'cam-tasarimi' },
      { s: 'derz-sizdirmazlik' },
      { s: 'pencere-kapi' },
      { s: 'havalandirmali-cephe' },
      { s: 'cephe-kaplamalari', n: 'Taş, seramik, GRC, kompozit' },
      { s: 'statik-temelleri', n: 'Hesabı okuyabilmek için' },
      { s: 'ankraj-braket' },
      { s: 'yangin-yonetmelik' },
      { s: 'imalat-resmi', n: 'Atölyeye giden çizim' },
      { s: 'teknik-ingilizce', x: true, n: 'Uluslararası projeler için' },
      { s: 'gunes-kirici', x: true },
      { s: 'bipv', x: true, n: 'Cepheden elektrik' },
      { s: 'cephe-akustigi', x: true },
      { s: 'sac-metal', x: true },
      { s: 'cift-kabuk-cephe', x: true },
    ] },
  { id: 'cephe-muhendisi', ad: 'Cephe mühendisi (hesap)', ozet: 'Statik, cam, ısıl ve yangın hesaplarını yapıp raporlayabilmek.',
    kim: 'Cephe statiği, ısıl hesap ve performans raporu hazırlayan ya da kontrol eden mühendisler.',
    adim: [
      { s: 'cephe-temelleri', n: 'Sistemleri tanımadan hesap olmaz' },
      { s: 'statik-temelleri' },
      { s: 'ankraj-braket' },
      { s: 'cam-tasarimi' },
      { s: 'cephe-fizigi' },
      { s: 'isil-hesap', n: 'Uf, ψ, Uw, Ucw adım adım' },
      { s: 'cephe-akustigi', n: 'Ses yalıtımı hesabı' },
      { s: 'sonlu-elemanlar' },
      { s: 'yangin-yonetmelik' },
      { s: 'mockup-test', n: 'Hesabın sahadaki karşılığı' },
      { s: 'surdurulebilir-cephe', x: true },
      { s: 'bipv', x: true },
      { s: 'cift-kabuk-cephe', x: true },
    ] },
  { id: 'bim-koordinatoru', ad: 'BIM koordinatörü', ozet: 'Revit modelini kurmak, aile yapmak, bulutta ekipçe çalışmak ve modelleri koordine etmek.',
    kim: 'Revit kullanan ya da kullanmaya başlayacak tasarımcılar, BIM modelleyiciler ve koordinatörler.',
    adim: [
      { s: 'revit-temelleri', n: 'Ya da ekran görüntülü Revit Adım Adım' },
      { s: 'revit-adim-adim', x: true },
      { s: 'revit-family' },
      { s: 'lod-seviyeleri' },
      { s: 'revit-paftalama' },
      { s: 'acc-docs-bim-collaborate', n: 'Bulutta ortak çalışma' },
      { s: 'bim-koordinasyon' },
      { s: 'navisworks-cakisma' },
      { s: 'rolove-lazer-tarama', n: 'Var olan yapıyı modele almak' },
      { s: 'dynamo', n: 'Tekrar eden işleri otomatikleştirmek' },
      { s: 'revit-python', x: true },
      { s: 'revit-cephe-projesi', x: true },
      { s: 'revit-30-gun', x: true, n: 'Daha uzun ve ayrıntılı alternatif' },
      { s: 'revit-family-30-gun', x: true, n: 'Aile yapımında derinleşmek' },
      { s: 'revit-mimari-apartman', x: true, n: 'Baştan sona bir mimari proje' },
    ] },
  { id: 'hesaplamali-tasarim', ad: 'Hesaplamalı tasarım', ozet: 'Parametrik ve algoritmik tasarımla karmaşık cepheleri üretmek, panellere bölmek ve BIM\'e aktarmak.',
    kim: 'Rhino, Grasshopper ya da CATIA ile serbest formlu cephe ve panelizasyon işi yapanlar.',
    adim: [
      { s: 'tasari-geometri', n: 'Uzay geometrisinin temeli' },
      { s: 'parametrik-tasarim', n: 'Mantık ve kavramlar' },
      { s: 'rhino' },
      { s: 'grasshopper' },
      { s: 'parametrik-cephe' },
      { s: 'panelizasyon', n: 'Üretilebilir panel' },
      { s: 'rhino-python', n: 'Ya da C#' },
      { s: 'rhino-csharp', x: true },
      { s: 'rhino-inside-revit', n: 'Geometriden BIM\'e' },
      { s: 'revit', x: true, n: 'Rhino bilenler için Revit' },
      { s: 'catia', x: true },
      { s: 'catia-visual-scripting', x: true },
      { s: 'parametrik-modelleme', x: true },
      { s: 'blender', x: true, n: 'Görselleştirme ve render' },
    ] },
  { id: 'proje-saha', ad: 'Proje ve saha yönetimi', ozet: 'Bir cephe işini tekliften kesin kabule kadar yönetmek.',
    kim: 'Cephe firmalarında proje müdürleri, şantiye şefleri, teklif ve hakediş sorumluları.',
    adim: [
      { s: 'cephe-temelleri' },
      { s: 'cephe-proje-yonetimi' },
      { s: 'cephe-metraj' },
      { s: 'cephe-teklif-maliyet' },
      { s: 'sozlesme-hakedis' },
      { s: 'cephe-montaj' },
      { s: 'rolove-lazer-tarama', x: true, n: 'Montaj öncesi sapma analizi' },
      { s: 'kalite-yonetimi' },
      { s: 'mockup-test' },
      { s: 'cephe-bakim-erisim', n: 'Teslimden sonrası' },
      { s: 'acc-docs-bim-collaborate', x: true },
    ] },
  { id: 'cad-otomasyonu', ad: 'CAD otomasyonu', ozet: 'Çizim programlarındaki tekrar eden işleri bloklar, makrolar ve betiklerle otomatikleştirmek.',
    kim: 'AutoCAD, SolidWorks ve Excel ile çok çalışan teknik ressam ve tasarımcılar.',
    adim: [
      { s: 'autocad' },
      { s: 'autocad-dinamik-blok' },
      { s: 'autolisp' },
      { s: 'excel-ileri' },
      { s: 'excel-vba' },
      { s: 'power-bi', n: 'Excel raporundan panoya' },
      { s: 'solidworks', x: true },
      { s: 'solidworks-denklemler', x: true },
      { s: 'solidworks-vba', x: true },
      { s: 'python', n: 'Her programda işe yarar' },
      { s: 'solidworks-python', x: true },
    ] },
  { id: 'yazilima-gecis', ad: 'Tasarımdan yazılıma', ozet: 'Kendi araçlarını yazabilecek kadar programlama öğrenmek ve web\'de yayınlamak.',
    kim: 'Programlamaya yeni başlayan, kendi hesap araçlarını ve uygulamalarını yapmak isteyen tasarımcılar.',
    adim: [
      { s: 'programlama-temelleri' },
      { s: 'python' },
      { s: 'python-veri-analizi' },
      { s: 'power-bi', x: true },
      { s: 'git-github-pages', n: 'Yayınlamak ve sürüm takibi' },
      { s: 'web-araclari' },
      { s: 'javascript-typescript' },
      { s: 'sql-veri' },
      { s: 'nodejs-postgresql', n: 'Kendi API\'n ve veritabanın' },
      { s: 'react', x: true },
      { s: 'flutter', x: true, n: 'Telefon uygulaması' },
      { s: 'internet-programciligi', x: true },
      { s: 'python-masaustu', x: true },
      { s: 'algoritmalar', x: true },
      { s: 'veri-yapilari', x: true },
    ] },
  { id: 'programlama-dilleri', ad: 'Programlama dilleri', ozet: 'Programlamanın temelinden sonra amacına göre bir ana dil seçip derinleşmek.',
    kim: 'Temel programlamayı bilen, hangi dili öğreneceğine karar vermek ve sistemli ilerlemek isteyenler.',
    adim: [
      { s: 'programlama-temelleri' },
      { s: 'algoritmalar', n: 'Her dilde geçerli düşünme biçimi' },
      { s: 'veri-yapilari' },
      { s: 'c-dili', n: 'Bellek ve donanıma yakın programlama' },
      { s: 'csharp', n: 'Masaüstü ve CAD eklentileri (Revit, Rhino, AutoCAD)' },
      { s: 'javascript-typescript', n: 'Web ve tarayıcı' },
      { s: 'cpp', x: true, n: 'Performans, oyun ve gömülü sistemler' },
      { s: 'java', x: true, n: 'Kurumsal yazılım' },
      { s: 'kotlin', x: true, n: 'Android' },
      { s: 'flutter', x: true, n: 'Android ve iOS tek kodla' },
      { s: 'swift', x: true, n: 'iPhone ve Mac' },
      { s: 'go', x: true, n: 'Sunucu ve komut satırı araçları' },
      { s: 'rust', x: true, n: 'Güvenli sistem programlama' },
      { s: 'php', x: true, n: 'Klasik web siteleri' },
    ] },
  { id: 'sistem-altyapi', ad: 'Sistem, ağ ve güvenlik', ozet: 'Bilgisayarı, ağı ve sunucuyu anlamak; kendi araçlarını güvenle çalıştırmak ve yayına almak.',
    kim: 'Ofisin IT işlerine yardım eden, kendi sunucusunu ya da otomasyonunu kurmak isteyen tasarımcı ve yazılımcılar.',
    adim: [
      { s: 'bilgi-teknolojileri' },
      { s: 'bilgisayar-aglari' },
      { s: 'linux-komut-satiri' },
      { s: 'siber-guvenlik' },
      { s: 'docker', n: 'Servisleri paketlemek' },
      { s: 'nodejs-postgresql', x: true, n: 'Docker\'da çalışacak bir servis' },
    ] },
  { id: 'yapay-zeka', ad: 'Yapay zekâyla verimli çalışma', ozet: 'Yapay zekâyı günlük işte güvenli ve verimli kullanmak, sonra otomasyona taşımak.',
    kim: 'Ofiste, şantiyede ya da tasarımda yapay zekâdan gerçek iş çıkarmak isteyen herkes.',
    adim: [
      { s: 'yapay-zeka' },
      { s: 'yapay-zeka-prompt' },
      { s: 'yapay-zeka-verimlilik' },
      { s: 'yapay-zeka-guvenli', n: 'Kurumsal veride dikkat' },
      { s: 'yapay-zeka-excel' },
      { s: 'yapay-zeka-arastirma' },
      { s: 'yapay-zeka-gorsel', x: true },
      { s: 'yapay-zeka-kod' },
      { s: 'yapay-zeka-ajanlari', x: true },
      { s: 'makine-ogrenmesi', x: true, n: 'Modeller nasıl öğrenir' },
      { s: 'yapay-zeka-ingilizce', x: true, n: 'Dil öğrenmede yapay zekâ' },
    ] },
];

const tools = fs.readFileSync(path.join(KOK, 'Tools.html'), 'utf8');
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
const ITEM = {};
G.forEach(g => g.items.forEach(it => { const m = /^egitimler\/([^/]+)\/index\.html$/.exec(it.f); if (m) ITEM[m[1]] = it; }));

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gun = it => { const m = /(\d+)\s*gün/.exec((it.tag && (it.tag.tr || it.tag)) || ''); return m ? +m[1] : 7; };
const eksik = [];
const yollar = YOLLAR.map(y => ({ ...y, adim: y.adim.filter(a => ITEM[a.s] || (eksik.push(y.id + ':' + a.s), false)) }));
if (eksik.length) console.warn('yollar.mjs: bulunamayan eğitimler atlandı:', eksik.join(', '));

const adimHtml = (a, i) => { const it = ITEM[a.s];
  return `<li class="adim${a.x ? ' secmeli' : ''}" data-k="/egitimler/${a.s}/"><a href="../${a.s}/">
    <span class="no">${a.x ? '+' : i}</span><span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[it.i] || ''}</svg></span>
    <span class="tx"><b>${esc(it.t.tr)}</b>${a.x ? ' <em class="sec">seçmeli</em>' : ''}<small>${esc(a.n || (it.d && it.d.tr) || '')}</small></span>
    <span class="sag"><i class="tag">${esc((it.tag && (it.tag.tr || it.tag)) || '')}</i><i class="ilr"></i></span></a></li>`; };
const yolHtml = y => { let k = 0; const zor = y.adim.filter(a => !a.x); const top = zor.reduce((s, a) => s + gun(ITEM[a.s]), 0);
  return `<section class="yol" id="${y.id}" data-id="${y.id}">
  <div class="yol-bas"><h2>${esc(y.ad)}</h2><span class="meta">${zor.length} temel eğitim · ~${top} gün${y.adim.length > zor.length ? ` · +${y.adim.length - zor.length} seçmeli` : ''}</span></div>
  <p class="ozet">${esc(y.ozet)} <span class="kim">Kimler için: ${esc(y.kim)}</span></p>
  <div class="durum"><div class="cubuk"><i></i></div><span class="yazi"></span><a class="git" href="../${zor[0].s}/">Başla →</a></div>
  <ol class="adimlar">${y.adim.map(a => adimHtml(a, a.x ? 0 : ++k)).join('')}</ol>
</section>`; };

const baslik = 'Öğrenme Yolları: Cephe, BIM, Hesaplamalı Tasarım ve Yazılım | erdevelop';
const aciklama = `Nereden başlayacağını bilmeyenler için ${yollar.length} sıralı öğrenme yolu: cephe tasarımcısı, cephe mühendisi, BIM koordinatörü, hesaplamalı tasarım, proje ve saha, CAD otomasyonu, yazılım ve yapay zekâ.`;
const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Öğrenme yolları', url: SITE + 'egitimler/yollar/', inLanguage: 'tr', description: aciklama,
  hasPart: yollar.map(y => ({ '@type': 'ItemList', name: y.ad, url: SITE + 'egitimler/yollar/#' + y.id, itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: y.adim.map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: ITEM[a.s].t.tr, url: SITE + 'egitimler/' + a.s + '/' })) })) };

const html = `<!doctype html>
<html lang="tr" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/yollar.mjs). Elle değiştirme; yolları o dosyada, eğitimleri Tools.html'de düzenle. -->
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${SITE}egitimler/yollar/">
<meta property="og:type" content="website"><meta property="og:site_name" content="erdevelop"><meta property="og:title" content="${esc(baslik)}"><meta property="og:description" content="${esc(aciklama)}"><meta property="og:url" content="${SITE}egitimler/yollar/">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b1220"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="../../kesif/tema.css">
<style>
.gorunum { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin: 14px 0 4px; }
.gorunum a { font: 500 13px var(--f-mono); padding: 8px 14px; color: var(--text); text-decoration: none; background: var(--panel); }
.gorunum a + a { border-left: 1px solid var(--line); }
.gorunum a.on { background: var(--accent); color: var(--on-accent, #fff); }
.secim { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin: 18px 0 8px; }
.secim a { display: block; padding: 12px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); text-decoration: none; color: var(--fg); }
.secim a:hover, .secim a.on { border-color: var(--accent); }
.secim b { display: block; font: 600 15px var(--f-body); }
.secim span { display: block; font: 400 12px var(--f-mono); color: var(--muted); margin-top: 3px; }
.secim .pc { color: #2e8b57; }
.yol { margin-top: 38px; scroll-margin-top: 80px; }
.yol-bas { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
.yol-bas h2 { font: 700 1.25rem var(--f-display); margin: 0; text-transform: uppercase; letter-spacing: .5px; }
.yol-bas .meta { font: 400 12px var(--f-mono); color: var(--muted); }
.ozet { color: var(--text); max-width: 80ch; margin: 10px 0 6px; line-height: 1.6; }
.ozet .kim { display: block; font-size: .9rem; color: var(--muted); margin-top: 4px; }
.durum { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 10px 0 14px; }
.durum .cubuk { flex: 1 1 200px; max-width: 360px; height: 6px; border-radius: 6px; background: var(--line); overflow: hidden; }
.durum .cubuk i { display: block; height: 100%; width: 0; background: #2e8b57; }
.durum .yazi { font: 400 12px var(--f-mono); color: var(--muted); }
.durum .git { font: 600 13px var(--f-body); color: var(--on-accent, #fff); background: var(--accent); padding: 7px 14px; border-radius: 6px; text-decoration: none; }
.adimlar { list-style: none; margin: 0; padding: 0; position: relative; }
.adimlar::before { content: ''; position: absolute; left: 17px; top: 10px; bottom: 10px; width: 2px; background: var(--line); }
.adim a { position: relative; display: grid; grid-template-columns: 36px 40px 1fr auto; gap: 12px; align-items: center; padding: 9px 12px 9px 0; text-decoration: none; color: var(--fg); border-radius: 8px; }
.adim a:hover { background: var(--panel); }
.adim .no { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font: 600 14px var(--f-mono); background: var(--panel); border: 2px solid var(--line); color: var(--text); z-index: 1; }
.adim .ico { width: 40px; height: 40px; border-radius: 6px; background: var(--panel-2); border: 1px solid var(--line); color: var(--accent); display: grid; place-items: center; }
.adim .ico svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.adim .tx b { font: 600 15px var(--f-body); }
.adim .tx small { display: block; color: var(--text); font-size: .85rem; line-height: 1.45; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.adim .sec { font: 400 11px var(--f-mono); color: var(--muted); font-style: normal; border: 1px solid var(--line); border-radius: 999px; padding: 1px 7px; margin-left: 6px; }
.adim.secmeli { opacity: .82; }
.adim.secmeli .no { border-style: dashed; }
.adim .sag { text-align: right; font: 400 11px var(--f-mono); color: var(--muted); }
.adim .sag i { display: block; font-style: normal; }
.adim .ilr { color: #2e8b57; font-weight: 600; }
.adim.tamam .no { background: #2e8b57; border-color: #2e8b57; color: #fff; }
.adim.yarim .no { border-color: #2e8b57; color: #2e8b57; }
.adim.sira a { background: var(--panel); outline: 1px solid var(--accent); }
@media (max-width: 560px) { .adim a { grid-template-columns: 36px 1fr; } .adim .ico { display: none; } .adim .sag { grid-column: 2; text-align: left; display: flex; gap: 8px; } }
.doc { max-width: 860px; margin-top: 44px; }
.doc h2 { font: 700 1.2rem/1.3 var(--f-display); color: var(--fg); margin: 0 0 10px; }
.doc p, .doc li { color: var(--text); line-height: 1.65; }
</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
<script>try{var d=new Date().toDateString();if(localStorage.getItem('erdevelop-mode-gun')!==d){localStorage.setItem('erdevelop-mode',matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');localStorage.setItem('erdevelop-mode-gun',d)}}catch(e){}</script>
<link rel="stylesheet" href="/css/kabuk.css">
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="topbar"><div class="wrap">
  <a class="brand" href="../../">erdevelop<span>_</span></a><span class="crumb">/ <a href="../">eğitimler</a> / yollar</span><span class="sp"></span>
  <a class="tb" href="../sozluk/">Sözlük</a><a class="tb" href="../../Tools.html">Araçlar</a><button class="tb" type="button" id="modeBtn">LIGHT</button>
</div></div>
<main class="wrap">
  <header class="head"><h1>Öğrenme yolları</h1><p>Eğitimlere iki yoldan bakabilirsin: hepsini konularına göre listeleyen <a href="../">tüm eğitimler</a> sayfası ya da burada, bir hedefe göre <b>sıralanmış</b> yollar. Bir yol seç, numaralı sırayla ilerle; "seçmeli" olanlar isteğe bağlı. İşaretlediğin eğitimler tamamlandıkça yol da ilerler.</p>
  <nav class="gorunum" aria-label="Görünüm"><a href="../">Tüm eğitimler</a><a class="on" href="./" aria-current="page">Öğrenme yolları</a><a href="../panom/">Panom</a><a href="../../yapay-zeka/">Yapay zekâ bölümü</a></nav>
  </header>
  <div class="secim" id="secim">${yollar.map(y => `<a href="#${y.id}" data-id="${y.id}"><b>${esc(y.ad)}</b><span>${y.adim.filter(a => !a.x).length} eğitim <em class="pc"></em></span></a>`).join('')}</div>
${yollar.map(yolHtml).join('\n')}
  <section class="doc">
    <h2>Yollar nasıl kullanılır?</h2>
    <ul><li>Yollar bir öneridir; bildiğin bir eğitimi atlayabilir, sırayı değiştirebilirsin. Aynı eğitim birden çok yolda yer alabilir; bir kez tamamlaman yeter.</li>
    <li>Her eğitimin ilerlemesi kendi sayfasında işaretlenir; bu sayfa o işaretlere bakarak hangi adımda olduğunu gösterir. Hesapla giriş yaptıysan diğer cihazlarında da aynı ilerlemeyi görürsün.</li>
    <li>Terimlerin Türkçe-İngilizce karşılıkları için <a href="../sozluk/">sözlüğe</a> bakabilirsin.</li></ul>
  </section>
</main>
<footer><div class="wrap"><span><a href="../../hakkinda.html">Hakkında</a> · <a href="../../gizlilik.html">Gizlilik</a> · <a href="../../kullanim.html">Kullanım şartları</a></span><a href="../">← tüm eğitimler</a></div></footer>
<script src="../../kesif/tema.js"></script>
<script>
(() => {
  let O = {}; try { O = JSON.parse(localStorage.getItem('erdevelop-egitim-ozet') || '{}') || {}; } catch (e) { }
  document.querySelectorAll('.yol').forEach(y => {
    const temel = [...y.querySelectorAll('.adim:not(.secmeli)')];
    let bitti = 0, sira = null;
    y.querySelectorAll('.adim').forEach(li => { const e = O[li.dataset.k]; const p = e && e.p > 0 ? Math.min(100, e.p) : 0;
      if (p >= 100) { li.classList.add('tamam'); li.querySelector('.ilr').textContent = '★ tamam'; }
      else if (p > 0) { li.classList.add('yarim'); li.querySelector('.ilr').textContent = '%' + p; } });
    temel.forEach(li => { if (li.classList.contains('tamam')) bitti++; else if (!sira) sira = li; });
    const pc = Math.round(bitti / temel.length * 100);
    y.querySelector('.cubuk i').style.width = pc + '%';
    y.querySelector('.yazi').textContent = bitti + '/' + temel.length + ' temel eğitim tamam';
    const git = y.querySelector('.git');
    if (sira) { sira.classList.add('sira'); git.href = sira.querySelector('a').getAttribute('href'); git.textContent = (bitti || sira.classList.contains('yarim') ? 'Devam et → ' : 'Başla → ') + sira.querySelector('b').textContent; }
    else { git.textContent = 'Yol tamamlandı ★'; git.removeAttribute('href'); }
    const k = document.querySelector('#secim [data-id="' + y.dataset.id + '"] .pc'); if (k && bitti) k.textContent = '· %' + pc;
  });
})();
</script>
<script>if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { }));</script>
<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
fs.mkdirSync(path.join(KOK, 'egitimler/yollar'), { recursive: true });
fs.writeFileSync(path.join(KOK, 'egitimler/yollar/index.html'), html);
console.log(`egitimler/yollar/index.html: ${yollar.length} yol`);

/* ---------- Panom: kişisel ilerleme sayfası (egitimler/panom/) ---------- */
const TUM = {};
G.forEach(g => g.items.forEach(it => { const m = /^egitimler\/([^/]+)\/index\.html$/.exec(it.f);
  if (m && m[1] !== 'sozluk' && m[1] !== 'yollar') TUM[m[1]] = { ad: it.t.tr, ic: ICON[it.i] || '', gun: gun(it) }; }));
const PVERI = { e: TUM, y: yollar.map(y => ({ id: y.id, ad: y.ad, a: y.adim.map(a => a.x ? '+' + a.s : a.s) })) };
const pBaslik = 'Panom: Eğitim İlerlemem | erdevelop';
const pAciklama = 'Devam ettiğin eğitimler, öğrenme yollarındaki ilerlemen ve sıradaki önerilen eğitim tek ekranda. İlerleme tarayıcında saklanır.';
const panom = `<!doctype html>
<html lang="tr" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/yollar.mjs). Elle değiştirme. -->
<title>${esc(pBaslik)}</title>
<meta name="description" content="${esc(pAciklama)}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${SITE}egitimler/panom/">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b1220"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="../../kesif/tema.css">
<style>
.gorunum { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin: 14px 0 4px; }
.gorunum a { font: 500 13px var(--f-mono); padding: 8px 14px; color: var(--text); text-decoration: none; background: var(--panel); }
.gorunum a + a { border-left: 1px solid var(--line); }
.gorunum a.on { background: var(--accent); color: var(--on-accent, #fff); }
.sayilar { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0 6px; }
.sayilar div { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 12px 14px; }
.sayilar b { display: block; font: 700 1.6rem var(--f-display); color: var(--fg); }
.sayilar span { font: 400 12px var(--f-mono); color: var(--muted); }
.bolum { margin-top: 34px; }
.bolum > h2 { font: 700 1.1rem var(--f-display); text-transform: uppercase; letter-spacing: .5px; margin: 0 0 12px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
.oneri { display: grid; grid-template-columns: 48px 1fr auto; gap: 14px; align-items: center; border: 1px solid var(--accent); border-radius: 10px; background: var(--panel); padding: 14px 16px; text-decoration: none; color: var(--fg); }
.oneri small { display: block; font: 400 12px var(--f-mono); color: var(--muted); }
.oneri b { font: 600 16px var(--f-body); }
.oneri .git { font: 600 13px var(--f-body); color: var(--on-accent, #fff); background: var(--accent); padding: 8px 14px; border-radius: 6px; }
.ico { width: 44px; height: 44px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--line); color: var(--accent); display: grid; place-items: center; }
.ico svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.liste { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; }
.kart { display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); text-decoration: none; color: var(--fg); }
.kart:hover { border-color: var(--accent); }
.kart b { font: 600 14px var(--f-body); display: block; }
.kart small { font: 400 11px var(--f-mono); color: var(--muted); }
.cubuk { height: 6px; border-radius: 6px; background: var(--line); overflow: hidden; margin-top: 6px; }
.cubuk i { display: block; height: 100%; background: #2e8b57; }
.yollar { display: grid; gap: 10px; }
.yol { display: grid; grid-template-columns: 1fr 200px auto; gap: 14px; align-items: center; padding: 12px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
.yol b { font: 600 15px var(--f-body); }
.yol small { display: block; font: 400 12px var(--f-mono); color: var(--muted); margin-top: 2px; }
.yol a { font: 500 13px var(--f-mono); color: var(--accent); text-decoration: none; white-space: nowrap; }
@media (max-width: 640px) { .yol { grid-template-columns: 1fr; } .oneri { grid-template-columns: 44px 1fr; } .oneri .git { grid-column: 1 / -1; text-align: center; } }
.bos { border: 1px dashed var(--line); border-radius: 10px; padding: 18px; color: var(--text); line-height: 1.6; }
.not { font: 400 12px var(--f-mono); color: var(--muted); margin-top: 34px; line-height: 1.6; }
.not button { font: 500 12px var(--f-mono); color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 5px 10px; cursor: pointer; margin-left: 6px; }
</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
<script>try{var d=new Date().toDateString();if(localStorage.getItem('erdevelop-mode-gun')!==d){localStorage.setItem('erdevelop-mode',matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');localStorage.setItem('erdevelop-mode-gun',d)}}catch(e){}</script>
<link rel="stylesheet" href="/css/kabuk.css">
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="topbar"><div class="wrap">
  <a class="brand" href="../../">erdevelop<span>_</span></a><span class="crumb">/ <a href="../">eğitimler</a> / panom</span><span class="sp"></span>
  <a class="tb" href="../sozluk/">Sözlük</a><a class="tb" href="../../Tools.html">Araçlar</a><button class="tb" type="button" id="modeBtn">LIGHT</button>
</div></div>
<main class="wrap">
  <header class="head"><h1>Panom</h1><p>Devam ettiğin eğitimler, öğrenme yollarındaki ilerlemen ve sıradaki önerimiz. İlerleme bu tarayıcıda saklanır; Hesapla giriş yaptıysan diğer cihazlarınla da eşitlenir.</p>
  <nav class="gorunum" aria-label="Görünüm"><a href="../">Tüm eğitimler</a><a href="../yollar/">Öğrenme yolları</a><a class="on" href="./" aria-current="page">Panom</a><a href="../../yapay-zeka/">Yapay zekâ bölümü</a></nav>
  </header>
  <div id="panel"></div>
  <p class="not">İpucu: bir eğitimde gün sonu kontrol listesini işaretledikçe ilerlemen burada görünür. <button type="button" id="sil">Panodaki kayıtları temizle</button></p>
</main>
<footer><div class="wrap"><span><a href="../../hakkinda.html">Hakkında</a> · <a href="../../gizlilik.html">Gizlilik</a> · <a href="../../kullanim.html">Kullanım şartları</a></span><a href="../">← tüm eğitimler</a></div></footer>
<script src="../../kesif/tema.js"></script>
<script>
(() => {
  const V = ${JSON.stringify(PVERI)};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let O = {}; try { O = JSON.parse(localStorage.getItem('erdevelop-egitim-ozet') || '{}') || {}; } catch (e) { }
  /* İngilizce sürümün ilerlemesi de aynı eğitime sayılır */
  const P = {};
  for (const [k, e] of Object.entries(O)) { const m = /^\\/egitimler\\/([^/]+)\\/(en\\/)?$/.exec(k); if (!m || !V.e[m[1]] || !e) continue;
    const s = m[1], p = Math.min(100, +e.p || 0); if (!P[s] || p > P[s].p) P[s] = { p, t: Math.max(+e.t || 0, P[s] ? P[s].t : 0) }; }
  const pc = s => (P[s] ? P[s].p : 0);
  const kart = (s, alt) => '<a class="kart" href="../' + s + '/"><span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">' + V.e[s].ic + '</svg></span><span><b>' + esc(V.e[s].ad) + '</b><small>' + alt + '</small><div class="cubuk"><i style="width:' + pc(s) + '%"></i></div></span></a>';
  const devam = Object.keys(P).filter(s => P[s].p > 0 && P[s].p < 100).sort((a, b) => P[b].t - P[a].t);
  const bitti = Object.keys(P).filter(s => P[s].p >= 100).sort((a, b) => P[b].t - P[a].t);
  const yollar = V.y.map(y => { const temel = y.a.filter(a => a[0] !== '+'); const tam = temel.filter(s => pc(s) >= 100).length;
    const dok = y.a.some(a => pc(a.replace('+', '')) > 0); const sira = temel.find(s => pc(s) < 100);
    return { ...y, temel, tam, dok, sira, yuzde: Math.round(tam / temel.length * 100) }; });
  const aktif = yollar.filter(y => y.dok).sort((a, b) => b.yuzde - a.yuzde || b.tam - a.tam);
  /* öneri: önce yarım kalan son eğitim, sonra en ilerideki yolun sıradaki adımı */
  let oneri = null;
  if (devam.length) oneri = { s: devam[0], neden: 'Kaldığın yerden devam et · %' + pc(devam[0]) };
  else { const y = aktif.find(y => y.sira); if (y) oneri = { s: y.sira, neden: y.ad + ' yolunda sıradaki adım (' + (y.tam + 1) + '/' + y.temel.length + ')' }; }
  const h = [];
  h.push('<div class="sayilar"><div><b>' + devam.length + '</b><span>devam eden eğitim</span></div><div><b>' + bitti.length + '</b><span>tamamlanan eğitim</span></div><div><b>' + aktif.length + '</b><span>başladığın yol</span></div><div><b>' + yollar.filter(y => y.dok && !y.sira).length + '</b><span>tamamlanan yol</span></div></div>');
  if (oneri) h.push('<section class="bolum"><h2>Sıradaki önerimiz</h2><a class="oneri" href="../' + oneri.s + '/"><span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">' + V.e[oneri.s].ic + '</svg></span><span><small>' + esc(oneri.neden) + '</small><b>' + esc(V.e[oneri.s].ad) + '</b></span><span class="git">' + (pc(oneri.s) ? 'Devam et →' : 'Başla →') + '</span></a></section>');
  else h.push('<section class="bolum"><h2>Nereden başlamalı?</h2><div class="bos">Henüz bir eğitime başlamadın. Hedefine uygun bir <a href="../yollar/">öğrenme yolu</a> seç ya da <a href="../">bütün eğitimlere</a> göz at. Bir eğitimde gün sonu kontrol listesini işaretlediğinde ilerlemen burada görünür.</div>'
    + '<div class="yollar" style="margin-top:12px">' + V.y.slice(0, 4).map(y => '<div class="yol"><span><b>' + esc(y.ad) + '</b><small>' + y.a.filter(a => a[0] !== '+').length + ' temel eğitim</small></span><span></span><a href="../yollar/#' + y.id + '">Yola bak →</a></div>').join('') + '</div></section>');
  if (devam.length) h.push('<section class="bolum"><h2>Devam eden eğitimler</h2><div class="liste">' + devam.map(s => kart(s, '%' + pc(s) + ' · son çalışma ' + new Date(P[s].t || Date.now()).toLocaleDateString('tr-TR'))).join('') + '</div></section>');
  if (aktif.length) h.push('<section class="bolum"><h2>Öğrenme yollarım</h2><div class="yollar">' + aktif.map(y => '<div class="yol"><span><b>' + esc(y.ad) + '</b><small>' + y.tam + '/' + y.temel.length + ' temel eğitim tamam' + (y.sira ? ' · sıradaki: ' + esc(V.e[y.sira].ad) : ' · yol tamamlandı ★') + '</small></span><div class="cubuk"><i style="width:' + y.yuzde + '%"></i></div><a href="../yollar/#' + y.id + '">%' + y.yuzde + ' · yola git →</a></div>').join('') + '</div></section>');
  if (bitti.length) h.push('<section class="bolum"><h2>Tamamlananlar ★</h2><div class="liste">' + bitti.map(s => kart(s, 'tamamlandı · ' + new Date(P[s].t || Date.now()).toLocaleDateString('tr-TR') + ' · belgen eğitim sayfasında')).join('') + '</div></section>');
  document.getElementById('panel').innerHTML = h.join('');
  document.getElementById('sil').onclick = () => { if (confirm('Panodaki özet kayıtları silinsin mi? Eğitim sayfalarındaki işaretlerin silinmez; bir eğitimi açtığında özet yeniden oluşur.')) { localStorage.removeItem('erdevelop-egitim-ozet'); location.reload(); } };
})();
</script>
<script>if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { }));</script>
<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
fs.mkdirSync(path.join(KOK, 'egitimler/panom'), { recursive: true });
fs.writeFileSync(path.join(KOK, 'egitimler/panom/index.html'), panom);
console.log(`egitimler/panom/index.html: ${Object.keys(TUM).length} eğitim`);
