/* erdevelop · Yapay Zekâ bölümü sayfası üreticisi
   Tools.html'deki 'ai' grubunu (alt başlıklarıyla) okuyup yapay-zeka/index.html sayfasını üretir.
   Yapay zekâ ile ilgili yeni bir eğitim ya da araç Tools.html'de 'ai' grubuna eklenince bu sayfa da güncellenir.
   egitimler.mjs bu dosyayı çağırır; elle: node .github/indeks/yapay-zeka.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://erdevelop.com/';

/* alt başlıkların kısa açıklaması (sıra Tools.html'deki subs sırasıdır) */
const ADIM = {
  yol: 'Sıralı bir program istersen buradan başla: eğitimler önerilen sırayla, seçmeli olanlar işaretli.',
  anla: 'Seninle konuşan robot arkadaş Yapay Zeki ile tanış; bir yapay sinir ağının veriden nasıl öğrendiğini canlı izle.',
  arac: 'Konuşmayı yazıya dök, fotoğraftaki yazıyı oku, belgede anlamına göre ara, kişisel bilgiyi maskele, token say. Hepsi cihazında çalışır; ses, resim ve belgeler hiçbir yere gönderilmez.',
  kul: 'Dil modelleri nasıl çalışır, iyi komut nasıl yazılır, cevap nasıl doğrulanır, hangi veri paylaşılmaz.',
  is: 'Excel ve ofis işleri, sunum ve konsept görselleri, İngilizce pratiği: yapay zekâyı somut işlere uygula.',
  gel: 'Kod yazdırıp çalıştırmak, ajan ve otomasyon kurmak, makine öğrenmesinin temelleri.',
};
/* başka gruplarda duran ama yapay zekâ kullanan araçlar */
const DIGER = ['araclar/ses-analiz.html', 'Code.html'];

const KURAL = [
  ['Gizli veriyi koru', 'Müşteri, kişisel ya da sözleşme bilgisini yalnız kurumunun izin verdiği araçlara yaz; gerekiyorsa adları ve sayıları anonimleştir.'],
  ['Her sayıyı kontrol et', 'Model emin görünse de yanılabilir. Rakamları, kaynakları ve alıntıları asıl belgeden doğrula.'],
  ['Ne istediğini açık yaz', 'Amacı, okuyucuyu, biçimi ve sınırları söyle; mümkünse bir örnek ver. Belirsiz komut belirsiz cevap getirir.'],
  ['Çalıştırarak doğrula', 'Üretilen kodu ve hesabı küçük bir örnekte çalıştır, sonucu elle kontrol et. Mühendislik kararında son söz insandadır.'],
  ['Sorumluluk sende', 'Yapay zekânın yazdığını kendi adınla göndermeden önce baştan sona oku; hata çıkarsa muhatap sensin.'],
];

const TERIM = [
  ['Yapay zekâ', 'Artificial intelligence (AI)', 'Anlama, tahmin, karar verme ya da içerik üretme gibi insan zekâsı isteyen işleri yapan bilgisayar sistemlerinin genel adı.'],
  ['Makine öğrenmesi', 'Machine learning', 'Kuralları elle yazmak yerine örnek verilerden kural çıkaran yöntemler. Yapay zekânın bugün en çok kullanılan dalı.'],
  ['Derin öğrenme', 'Deep learning', 'Çok katmanlı yapay sinir ağlarıyla yapılan makine öğrenmesi. Görüntü, ses ve dil modellerinin temeli.'],
  ['Yapay sinir ağı', 'Neural network', 'Birbirine ağırlıklarla bağlı basit hesap birimlerinden (nöron) oluşan model. Ağırlıklar eğitim sırasında ayarlanır.'],
  ['Model', 'Model', 'Eğitimin sonunda elde edilen ve bir girdiden çıktı üreten yapı: mimari ile öğrenilmiş ağırlıkların bütünü.'],
  ['Parametre (ağırlık)', 'Parameter (weight)', 'Modelin eğitimle öğrendiği sayılar. Büyük dil modellerinde milyarlarca parametre bulunur.'],
  ['Eğitim', 'Training', 'Modelin tahmin hatasını azaltacak şekilde ağırlıklarının veriyle tekrar tekrar güncellenmesi.'],
  ['Gradyan inişi', 'Gradient descent', 'Ağırlıkları, hatanın en hızlı azaldığı yönde küçük adımlarla değiştiren eğitim yöntemi.'],
  ['Eğitim ve test verisi', 'Training / test set', 'Modelin öğrendiği veri ile başarısını ölçmek için ayrılan, eğitimde hiç görmediği veri.'],
  ['Aşırı öğrenme', 'Overfitting', 'Modelin eğitim verisini ezberleyip yeni verilerde kötü sonuç vermesi.'],
  ['Sınıflandırma ve regresyon', 'Classification / regression', 'Sınıflandırma bir kategori tahmin eder (sağlam / kusurlu); regresyon bir sayı tahmin eder (maliyet, süre).'],
  ['Çıkarım', 'Inference', 'Eğitilmiş modelin yeni bir girdiye cevap üretmesi. Sohbet ederken yapılan iş budur.'],
  ['Büyük dil modeli', 'Large language model (LLM)', 'Çok büyük metin verisiyle eğitilmiş, metnin devamını parça parça tahmin ederek yazı üreten model.'],
  ['Token', 'Token', 'Modelin metni böldüğü küçük parçalar: kelime, kelime parçası ya da işaret. Ücretler ve sınırlar çoğunlukla token ile ölçülür.'],
  ['Bağlam penceresi', 'Context window', 'Modelin tek seferde dikkate alabildiği toplam metin miktarı (komut, belgeler ve cevap birlikte).'],
  ['Bilgi kesim tarihi', 'Knowledge cutoff', 'Modelin eğitim verisinin bittiği tarih. Sonrasını ancak arama ya da verilen belgeler sayesinde bilebilir.'],
  ['Komut (prompt)', 'Prompt', 'Modele verilen talimat, bağlam ve örneklerin tamamı.'],
  ['Sistem komutu', 'System prompt', 'Sohbetin başında modelin rolünü ve kurallarını belirleyen, kullanıcının çoğunlukla görmediği talimat.'],
  ['Örnekle öğretme', 'Few-shot prompting', 'Komuta birkaç örnek girdi ve çıktı koyarak istenen biçimi göstermek.'],
  ['Akıl yürütme', 'Reasoning / chain of thought', 'Modelin cevaba adım adım giderek ulaşması. Bazı modeller bunu cevap vermeden önce kendiliğinden yapar.'],
  ['Sıcaklık', 'Temperature', 'Çıktının ne kadar çeşitli olacağını ayarlayan değer. Düşük değer daha tutarlı, yüksek değer daha yaratıcı sonuç verir.'],
  ['Halüsinasyon (uydurma)', 'Hallucination', 'Modelin doğru gibi görünen ama yanlış ya da hiç var olmayan bilgi, kaynak veya sayı üretmesi.'],
  ['Gömme (embedding)', 'Embedding', 'Metni ya da görseli anlamını temsil eden bir sayı dizisine çevirmek. Benzer anlamlar birbirine yakın düşer; anlamsal aramada kullanılır.'],
  ['RAG', 'Retrieval-augmented generation', 'Cevap vermeden önce ilgili belgeleri bulup modele vermek; böylece cevap kaynaklara dayanır.'],
  ['İnce ayar', 'Fine-tuning', 'Hazır bir modeli belli bir iş için ek veriyle yeniden eğitmek.'],
  ['Çok kipli model', 'Multimodal model', 'Metnin yanında görsel, ses ya da video da işleyebilen model.'],
  ['Difüzyon modeli', 'Diffusion model', 'Gürültüden başlayıp adım adım temizleyerek görsel üreten model türü.'],
  ['Araç çağırma', 'Tool use / function calling', 'Modelin cevap yazmak yerine bir aracı (arama, hesap, dosya) belirli girdilerle çalıştırmayı istemesi.'],
  ['Ajan', 'Agent', 'Bir hedefe ulaşmak için araçları kullanarak adım adım kendi ilerleyen yapay zekâ sistemi.'],
  ['MCP', 'Model Context Protocol', 'Yapay zekâ uygulamalarının dış araçlara ve veri kaynaklarına standart bir yolla bağlanmasını sağlayan açık protokol.'],
  ['Komut enjeksiyonu', 'Prompt injection', 'Belgeye, web sayfasına ya da e-postaya gizlenmiş talimatlarla modelin istenmeyen bir şey yapmaya yönlendirilmesi.'],
  ['Yanlılık', 'Bias', 'Eğitim verisindeki dengesizliklerin modelin sonuçlarına taşınması.'],
  ['Açık ağırlıklı model', 'Open-weight model', 'Ağırlıkları indirilip kendi bilgisayarında ya da sunucunda çalıştırılabilen model.'],
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
const AI = G.find(g => g.id === 'ai');
if (!AI) throw new Error("Tools.html'de 'ai' grubu yok");
const diger = DIGER.map(f => G.flatMap(g => g.items).find(it => it.f === f)).filter(Boolean);

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const href = f => '../' + f.replace(/index\.html$/, '');
const anahtar = f => '/' + f.replace(/index\.html$/, '');
const kart = it => `<a class="kart" href="${href(it.f)}" data-k="${esc(anahtar(it.f))}">
  <span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[it.i] || ''}</svg></span>
  <h4>${esc(it.t.tr)}</h4>
  ${it.d ? `<p>${esc(it.d.tr)}</p>` : ''}
  <span class="alt">${it.tag ? `<b>${esc(it.tag.tr || it.tag)}</b>` : ''}<i class="ilr"></i></span>
</a>`;
const adimlar = AI.subs.map((sb, n) => ({ sb, n, its: AI.items.filter(it => it.s === sb.id) })).filter(x => x.its.length);
const egitimSay = AI.items.filter(it => it.f.startsWith('egitimler/') && !it.f.startsWith('egitimler/yollar/')).length;
const aracSay = AI.items.filter(it => !it.f.startsWith('egitimler/')).length;

const baslik = 'Yapay Zekâ: Ücretsiz Türkçe Eğitimler ve Araçlar | erdevelop';
const aciklama = `Yapay zekâyı anlamak ve işte kullanmak için ${egitimSay} ücretsiz Türkçe eğitim ve ${aracSay} tarayıcı aracı: sinir ağını izle, iyi komut yaz, doğrula, güvenli kullan, Excel, görsel, kod ve ajanlar. Yapay zekâ terimleri sözlüğü.`;
const ld = [
  { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Yapay Zekâ', url: SITE + 'yapay-zeka/', inLanguage: 'tr', description: aciklama,
    mainEntity: { '@type': 'ItemList', numberOfItems: AI.items.length, itemListElement: AI.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.t.tr, url: SITE + it.f.replace(/index\.html$/, '') })) } },
  { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Yapay zekâ terimleri', url: SITE + 'yapay-zeka/#terimler', inLanguage: 'tr',
    hasDefinedTerm: TERIM.map(([tr, en, t]) => ({ '@type': 'DefinedTerm', name: tr, alternateName: en, description: t })) },
];
const slug = s => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const html = `<!doctype html>
<html lang="tr" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/yapay-zeka.mjs). Elle değiştirme; içerikleri Tools.html'deki 'ai' grubunda düzenle. -->
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${SITE}yapay-zeka/">
<meta property="og:type" content="website"><meta property="og:site_name" content="erdevelop"><meta property="og:title" content="${esc(baslik)}"><meta property="og:description" content="${esc(aciklama)}"><meta property="og:url" content="${SITE}yapay-zeka/"><meta property="og:image" content="${SITE}og/yapay-zeka.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="tr_TR"><meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0b1220"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="../kesif/tema.css">
<style>
.gorunum { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin: 14px 0 4px; }
.gorunum a { font: 500 13px var(--f-mono); padding: 8px 14px; color: var(--text); text-decoration: none; background: var(--panel); }
.gorunum a + a { border-left: 1px solid var(--line); }
.ozet { display: flex; gap: 18px; flex-wrap: wrap; margin: 12px 0 0; font: 400 12px var(--f-mono); color: var(--muted); }
.ozet b { color: var(--fg); font-weight: 600; }
.grup { margin-top: 34px; scroll-margin-top: 70px; }
.gd { color: var(--text); margin: -6px 0 14px; max-width: 80ch; font-size: .95rem; }
.adim-no { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: var(--on-accent, #fff); font: 700 13px var(--f-mono); flex: none; }
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
.kurallar { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; counter-reset: k; }
.kural { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 6px; padding: 12px 14px; }
.kural h4 { margin: 0 0 4px; font: 600 .95rem var(--f-body); color: var(--fg); }
.kural h4::before { counter-increment: k; content: counter(k) ' · '; color: var(--accent); font-family: var(--f-mono); }
.kural p { margin: 0; color: var(--text); font-size: .86rem; line-height: 1.5; }
.tara { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 0 0 12px; }
.tara .inp { flex: 1; min-width: 200px; max-width: 420px; }
.tara span { font: 400 12px var(--f-mono); color: var(--muted); }
.terimler { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 0 28px; margin: 0; }
.terim { padding: 10px 0; border-bottom: 1px solid var(--line); break-inside: avoid; scroll-margin-top: 70px; }
.terim dt { font: 600 .98rem var(--f-body); color: var(--fg); }
.terim dt i { font: 400 12px var(--f-mono); color: var(--muted); font-style: normal; margin-left: 6px; }
.terim dd { margin: 3px 0 0; color: var(--text); font-size: .88rem; line-height: 1.55; }
.terim:target { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.doc { max-width: 860px; margin-top: 44px; }
.doc h2 { font: 700 1.2rem/1.3 var(--f-display); color: var(--fg); margin: 0 0 10px; }
.doc p, .doc li { color: var(--text); line-height: 1.65; }
</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
<script>(function(){var k=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';try{var m=localStorage.getItem('erdevelop-mode'),g=localStorage.getItem('erdevelop-mode-gun');if(m&&g===new Date().toDateString())k=m}catch(e){}document.documentElement.setAttribute('data-mode',k)})()</script>
<link rel="stylesheet" href="/css/kabuk.css">
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="topbar"><div class="wrap">
  <a class="brand" href="../">erdevelop<span>_</span></a><span class="crumb">/ yapay zekâ</span><span class="sp"></span>
  <a class="tb" href="../egitimler/">Eğitimler</a><a class="tb" href="../Tools.html">Araçlar</a><button class="tb" type="button" id="modeBtn">LIGHT</button>
</div></div>
<main class="wrap">
  <header class="head"><h1>Yapay Zekâ</h1><p>Yapay zekânın nasıl öğrendiğini görmekten iş yerinde güvenle kullanmaya, oradan kendi otomasyonunu kurmaya kadar her şey tek yerde. Sırayla ilerleyebilir ya da ihtiyacın olan adıma atlayabilirsin. Eğitimler Türkçe ve ücretsiz; ilerlemen bu tarayıcıda, giriş yaptıysan hesabında saklanır.</p>
  <div class="ozet"><span><b>${egitimSay}</b> eğitim</span><span><b>${aracSay}</b> araç</span><span><b>${TERIM.length}</b> terim</span></div></header>
  <nav class="gorunum" aria-label="Bu sayfada">${adimlar.map(x => `<a href="#${x.sb.id}">${x.n + 1} · ${esc(x.sb.tr)}</a>`).join('')}<a href="#kurallar">Kurallar</a><a href="#terimler">Terimler</a></nav>
  <section class="grup" id="devam" hidden><div class="layer-head"><span class="swatch"></span><h2>Kaldığın yerden devam et</h2><span class="meta" id="devamN"></span></div><div class="izgara" id="devamL"></div></section>
${adimlar.map(x => `<section class="grup" id="${x.sb.id}"><div class="layer-head"><span class="adim-no">${x.n + 1}</span><h2>${esc(x.sb.tr)}</h2><span class="meta">${x.its.length}</span></div>${ADIM[x.sb.id] ? `<p class="gd">${esc(ADIM[x.sb.id])}</p>` : ''}<div class="izgara">${x.its.map(kart).join('')}</div></section>`).join('\n')}
${diger.length ? `<section class="grup" id="diger"><div class="layer-head"><span class="swatch"></span><h2>Yapay zekâ kullanan diğer araçlar</h2><span class="meta">${diger.length}</span></div><div class="izgara">${diger.map(kart).join('')}</div></section>` : ''}
  <section class="grup" id="kurallar"><div class="layer-head"><span class="swatch"></span><h2>İş yerinde beş temel kural</h2></div><p class="gd">Hangi aracı kullanırsan kullan geçerli olan kısa liste. Ayrıntısı <a href="../egitimler/yapay-zeka-guvenli/">İş Yerinde Güvenli ve Sorumlu Yapay Zekâ</a> eğitiminde.</p>
  <div class="kurallar">${KURAL.map(([h, p]) => `<div class="kural"><h4>${esc(h)}</h4><p>${esc(p)}</p></div>`).join('')}</div></section>
  <section class="grup" id="terimler"><div class="layer-head"><span class="swatch"></span><h2>Yapay zekâ terimleri</h2><span class="meta">${TERIM.length}</span></div><p class="gd">Eğitimlerde ve haberlerde sık geçen kavramların kısa açıklaması, İngilizce karşılıklarıyla.</p>
  <div class="tara"><input class="inp" id="tq" type="search" placeholder="Terim ara… (ör. token, ajan, RAG)" autocomplete="off" aria-label="Terim ara"><span id="tsay">${TERIM.length} terim</span></div>
  <dl class="terimler">${TERIM.map(([tr, en, t]) => `<div class="terim" id="t-${slug(tr)}"><dt>${esc(tr)}<i>${esc(en)}</i></dt><dd>${esc(t)}</dd></div>`).join('')}</dl></section>
  <section class="doc">
    <h2>Nereden başlamalıyım?</h2>
    <ul><li>Yapay zekâyla hiç çalışmadıysan <b>Öğrenme Laboratuvarı</b>'nda bir ağın öğrenişini izle, sonra <b>Yapay Zekâ ile Çalışmak</b> eğitimiyle başla.</li>
    <li>Zaten kullanıyorsan <b>İyi Komut Yazmak</b> ve <b>Araştırma ve Doğrulama</b> eğitimleri cevapların kalitesini en hızlı artıran ikilidir.</li>
    <li>Tekrarlayan işlerini otomatikleştirmek istiyorsan <b>Kod ve Otomasyon</b>, ardından <b>Ajanlar ve Otomasyon (n8n)</b> eğitimine geç.</li></ul>
    <p>Sıralı bir liste için <a href="../egitimler/yollar/#yapay-zeka">Yapay zekâyla verimli çalışma</a> öğrenme yoluna bak.</p>
    <p style="font-size:13px;opacity:.75">İçerikler bilgi ve ön bilgi amaçlıdır; hukuki, mesleki ya da güvenlik danışmanlığı yerine geçmez. Yapay zekâ araçlarının özellikleri hızla değiştiği için ekran ve menü adları farklılık gösterebilir. <a href="../kullanim.html">Kullanım şartları</a></p>
  </section>
</main>
<footer><div class="wrap"><span><a href="../hakkinda.html">Hakkında</a> · <a href="../gizlilik.html">Gizlilik</a> · <a href="../kullanim.html">Kullanım şartları</a></span><a href="../Tools.html">← tüm araçlar</a></div></footer>
<script src="../kesif/tema.js"></script>
<script>
(() => {
  const $ = id => document.getElementById(id);
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a');
  let O = {}; try { O = JSON.parse(localStorage.getItem('erdevelop-egitim-ozet') || '{}') || {}; } catch (e) { }
  document.querySelectorAll('.kart[data-k]').forEach(k => { const e = O[k.dataset.k]; if (!e || !(e.p > 0)) return;
    k.querySelector('.ilr').textContent = e.p >= 100 ? '★ tamamlandı' : '%' + e.p + ' · devam et';
    const b = document.createElement('span'); b.className = 'bar'; b.innerHTML = '<i style="width:' + Math.min(100, e.p) + '%"></i>'; k.appendChild(b); });
  const yarim = Object.entries(O).filter(([, e]) => e && e.p > 0 && e.p < 100).sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
    .map(([k]) => document.querySelector('.grup:not(#devam) .kart[data-k="' + CSS.escape(k) + '"]')).filter(Boolean).slice(0, 3);
  if (yarim.length) { $('devamL').append(...yarim.map(k => k.cloneNode(true))); $('devamN').textContent = yarim.length; $('devam').hidden = false; }
  const T = [...document.querySelectorAll('.terim')];
  $('tq').addEventListener('input', () => { const q = fold($('tq').value.trim()); let n = 0;
    T.forEach(t => { const ok = !q || fold(t.textContent).includes(q); t.hidden = !ok; if (ok) n++; }); $('tsay').textContent = n + ' terim'; });
})();
</script>
<script>if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { }));</script>
<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
fs.mkdirSync(path.join(KOK, 'yapay-zeka'), { recursive: true });
fs.writeFileSync(path.join(KOK, 'yapay-zeka/index.html'), html);
console.log(`yapay-zeka/index.html: ${adimlar.length} adım, ${AI.items.length} içerik, ${TERIM.length} terim`);
