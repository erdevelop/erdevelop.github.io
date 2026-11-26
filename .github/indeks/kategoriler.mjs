/* erdevelop · Kapı ve kategori sayfaları üreticisi
   Tools.html'deki araç gruplarını okuyup her grup için ayrı bir kategori sayfası (ör. /hesaplama-araclari/) ve
   üç kapı sayfası (/araclar/, /muhendislik/, /ogren/) üretir. Görünüm /css/portal.css, üst menü /js/portal.js.
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

/* hangi kategori hangi kapının altında */
const KAPI = [
  { id: 'araclar', yol: 'araclar', ton: 'var(--blue)', ad: ['Araçlar', 'Tools'], alt: ['calc', 'docs', 'dev', 'device', 'daily'],
    baslik: ['Ücretsiz Online Araçlar: Hesaplama, PDF, Dönüştürme', 'Free Online Tools: Calculators, PDF, Converters'],
    aciklama: ['Hesaplama araçları, PDF ve belge araçları, geliştirici yardımcıları, telefon ve günlük araçlar. Hepsi ücretsiz, üyeliksiz ve tarayıcıda çalışır.', 'Calculators, PDF and document tools, developer helpers, phone and everyday tools. All free, no sign-up, running in your browser.'],
    yazi: [['Araçlar bölümü, gün içinde hızlıca halletmek istediğin işleri tek yerde toplar: bir KDV ya da maaş hesabı, iki PDF’i birleştirmek, bir JSON’u düzenlemek, telefonu su terazisi olarak kullanmak. Her araç tek bir işi yapar, sonucu anında gösterir ve çoğu, hesabın nasıl yapıldığını da anlatır.', 'Araçların hepsi tarayıcında çalışır. Açtığın dosyalar ve girdiğin değerler cihazında kalır, bir sunucuya gönderilmez.'],
      ['The Tools section gathers the jobs you want done quickly during the day: a VAT or salary sum, merging two PDFs, tidying a JSON file, using your phone as a spirit level. Each tool does one job, shows the result instantly and most of them explain how the calculation works.', 'Everything runs in your browser. The files you open and the values you type stay on your device and are not sent to a server.']] },
  { id: 'muhendislik', yol: 'muhendislik', ton: 'var(--green)', ad: ['Mühendislik', 'Engineering'], alt: ['facade', 'tech', 'cad'],
    baslik: ['Mühendislik Araçları: Cephe ve Cam Hesapları, Tasarım, CAD', 'Engineering Tools: Facade & Glass Calculations, Design, CAD'],
    aciklama: ['Cephe ve cam için ön boyutlandırma hesapları, DXF ve RAL gibi tasarım araçları, AutoCAD, Revit, Rhino ve SolidWorks komut listeleri. Eğitim ve ön bilgi amaçlıdır.', 'Preliminary sizing for facades and glass, design tools such as DXF and RAL, and command lists for AutoCAD, Revit, Rhino and SolidWorks. For learning and early estimates.'],
    yazi: [['Mühendislik bölümü cephe, cam ve imalat tasarımında çalışanlar için hazırlandı: rüzgâr yükü, cam kalınlığı, dikme sehimi ve ankraj gibi ön hesaplar; DXF görüntüleyici ve RAL kartelası gibi tasarım araçları; çizim programlarının komut ve kısayol listeleri.', 'Buradaki hesaplar eğitim ve ön boyutlandırma amaçlıdır; statik proje, tip testi ya da yetkin bir mühendisin hesabı yerine geçmez. Uygulama kararlarını yürürlükteki standartlara göre yapılmış proje hesabıyla ver.'],
      ['The Engineering section is made for people working in facade, glass and fabrication design: preliminary calculations such as wind load, glass thickness, mullion deflection and anchors; design tools such as a DXF viewer and a RAL chart; and command and shortcut lists for drawing programs.', 'The calculations here are for learning and preliminary sizing only; they do not replace structural design, type testing or a qualified engineer. Base construction decisions on project calculations made to the applicable standards.']] },
];
const OGREN = { id: 'ogren', yol: 'ogren', ton: 'var(--amber)', ad: ['Öğren', 'Learn'], egitim: ['facadeedu', 'edu', 'code', 'plang', 'ai', 'lang'],
  baslik: ['Öğren: Ücretsiz Eğitimler, Yapay Zekâ, Dil Kulüpleri, Rehberler', 'Learn: Free Courses, AI, Language Clubs, Guides'],
  aciklama: ['Cephe, CAD/BIM, yazılım ve yapay zekâ üzerine adım adım ücretsiz eğitimler; yapay zekâ araçları, dil kulüpleri, hesap rehberleri ve Mikro Dünya ansiklopedisi.', 'Free step-by-step courses on facades, CAD/BIM, software and AI, plus AI tools, language clubs, how-to guides and the Micro World encyclopedia.'],
  buyuk: [
    { u: 'egitimler/', ton: 'var(--amber)', t: ['Eğitimler', 'Courses'], d: ['Cephe, CAD/BIM, yazılım ve yapay zekâ eğitimleri. Günde bir ders; ilerlemen bu tarayıcıda saklanır.', 'Facade, CAD/BIM, software and AI courses. One lesson a day; your progress is saved in this browser.'], c: ['Eğitimlere bak →', 'Browse courses →'] },
    { u: 'yapay-zeka/', ton: 'var(--violet)', t: ['Yapay zekâ', 'AI'], d: ['Çevirmen, özetleyici, istem kütüphanesi, cihazında çalışan yapay zekâ ve sesli robot Yapay Zeki.', 'Translator, summariser, prompt library, on-device AI and Yapay Zeki, the voice robot.'], c: ['Dene →', 'Try them →'] },
    { u: 'rehber/dil-kulupleri/', ton: 'var(--blue)', t: ['Dil kulüpleri', 'Language clubs'], d: ['İngilizce, Almanca ve daha fazlasını arkadaşlarınla birlikte çalış; kelime defteri tut.', 'Study English, German and more with friends; keep a word notebook.'], c: ['Katıl →', 'Join →'] },
    { u: 'rehber/', ton: 'var(--green)', t: ['Rehberler', 'Guides'], d: ['“Nasıl hesaplanır?” yazıları: maaş, kira, KDV, rüzgâr yükü, cam kalınlığı ve daha fazlası, adım adım.', 'How-it’s-calculated articles: salary, rent, VAT, wind load, glass thickness and more, step by step.'], c: ['Oku →', 'Read →'] },
    { u: 'mikro-dunya/', ton: 'var(--green)', t: ['Mikro Dünya', 'Micro World'], d: ['50 mikroskobik canlının ansiklopedisi, kendi su damlanı kurduğun laboratuvar ve bilgi yarışması.', 'An encyclopedia of 50 microscopic organisms, a lab where you build your own drop of water, and a quiz.'], c: ['Keşfet →', 'Explore →'] },
    { u: 'egitimler/sozluk/', ton: 'var(--amber)', t: ['Terimler sözlüğü', 'Glossary'], d: ['Cephe, CAD ve yapay zekâ terimlerinin kısa ve anlaşılır açıklamaları.', 'Short, clear explanations of facade, CAD and AI terms.'], c: ['Aç →', 'Open →'] },
  ],
  yazi: [['Öğren bölümü sitedeki bütün öğrenme içeriğini bir araya getirir. Eğitimler kısa günlük derslerden oluşur ve çoğu bir hafta ile bir ay arasında sürer. Rehberler tek bir soruyu baştan sona anlatır ve ilgili hesap aracına bağlanır. Hepsi ücretsizdir, üyelik gerekmez.'],
    ['The Learn section brings together all the learning content on the site. Courses are made of short daily lessons and most run from a week to a month. Guides answer one question from start to finish and link to the matching calculator. Everything is free, with no sign-up. Most content is in Turkish; a growing part is also in English.']] };
const kapiOf = id => id === 'games' ? null : KAPI.find(h => h.alt.includes(id));
const katOf = id => KATEGORI.find(k => k.id === id);
const grup = id => G.find(x => x.id === id);

const kart = (it, ton) => {
  const tg = tag(it.tag);
  return `<a class="kart" href="${esc(href(it.f))}"${ton ? ` style="--ton:${ton}"` : ''} data-s="${esc(fold(it.t.tr + ' ' + en(it.t) + ' ' + (it.d ? it.d.tr + ' ' + en(it.d) : '') + ' ' + it.f))}">
  ${it.logo ? `<span class="ico logo"><img src="../${esc(it.logo)}" alt="" loading="lazy" width="46" height="46"></span>` : `<span class="ico"><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[it.i] || ''}</svg></span>`}
  <h3${en(it.t) && en(it.t) !== it.t.tr ? ` data-en="${esc(en(it.t))}"` : ''}>${esc(it.t.tr)}</h3>
  ${it.d ? `<p${en(it.d) ? ` data-en="${esc(en(it.d))}"` : ''}>${esc(it.d.tr)}</p>` : ''}
  ${tg ? `<span class="alt" data-en="${esc(tg.en)}">${esc(tg.tr)}</span>` : ''}
</a>`;
};
/* oyun kartı: og/<ad>.jpg varsa görselli */
const ogYol = f => { const m = /^([A-Za-z0-9_-]+)\.html$/.exec(f) || /^([a-z0-9-]+)\/(?:index\.html)?$/.exec(f); return m && fs.existsSync(path.join(KOK, 'og', m[1] + '.jpg')) ? `../og/${m[1]}.jpg` : null; };
const vitrinKart = it => { const tg = tag(it.tag);
  return `<a href="${esc(href(it.f))}" data-s="${esc(fold(it.t.tr + ' ' + en(it.t) + ' ' + (it.d ? it.d.tr + ' ' + en(it.d) : '')))}"><img src="${ogYol(it.f)}" alt="" loading="lazy" width="1200" height="630"><div>${tg ? `<i data-en="${esc(tg.en)}">${esc(tg.tr)}</i>` : ''}<b${en(it.t) && en(it.t) !== it.t.tr ? ` data-en="${esc(en(it.t))}"` : ''}>${esc(it.t.tr)}</b>${it.d ? `<span${en(it.d) ? ` data-en="${esc(en(it.d))}"` : ''}>${esc(it.d.tr)}</span>` : ''}</div></a>`; };

const TEMA = `<script>(function(){try{var m=localStorage.getItem('erdevelop-mode'),g=localStorage.getItem('erdevelop-mode-gun');document.documentElement.setAttribute('data-mode',(m&&g===new Date().toDateString())?m:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))}catch(e){}})()</script>`;
const kafa = ({ baslik, aciklama, url, ld }) => `<!doctype html>
<html lang="tr" data-mode="light" data-portal>
<head>
<meta charset="utf-8">
${TEMA}
<script src="/dil.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Bu sayfa otomatik üretilir (.github/indeks/kategoriler.mjs). Elle değiştirme; araçları Tools.html'de, sayfa metnini üreticide düzenle. -->
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="erdevelop"><meta property="og:title" content="${esc(baslik)}"><meta property="og:description" content="${esc(aciklama)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}og/Tools.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#f5f7fd"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/css/portal.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4775308844679394" crossorigin="anonymous"></script>
<script src="/js/site.js" defer></script>
</head>`;
const kuyruk = (ekJs = '') => `<footer id="p-alt"></footer>
<script src="/js/portal.js"></script>
${ekJs}<script data-goatcounter="https://erdevelop.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;
const yol = parcalar => `<ol class="p-yol"><li><a href="../" data-en="Home">Ana sayfa</a></li>${parcalar.map(p => p.u ? `<li><a href="${p.u}" data-en="${esc(p.t[1])}">${esc(p.t[0])}</a></li>` : `<li aria-current="page" data-en="${esc(p.t[1])}">${esc(p.t[0])}</li>`).join('')}</ol>`;
const ldYol = parcalar => ({ '@type': 'BreadcrumbList', itemListElement: [{ n: 'erdevelop', u: SITE }, ...parcalar].map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.n, item: p.u })) });
const doc = (ad, yazi, ek = '') => `<section class="p wrap"><div class="p-doc" data-l="tr"><h2>${esc(ad[0])} hakkında</h2>${yazi[0].map(p => `<p>${esc(p)}</p>`).join('')}${ek}</div><div class="p-doc" data-l="en" hidden><h2>About ${esc(ad[1].toLowerCase())}</h2>${yazi[1].map(p => `<p>${esc(p)}</p>`).join('')}${ek}</div></section>`;
const SUZ = `<script>
(() => {
  const $ = id => document.getElementById(id);
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  $('q').addEventListener('input', () => {
    const qs = fold($('q').value.trim()).split(/\\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('#liste > a').forEach(k => { const ok = qs.every(w => k.dataset.s.includes(w)); k.hidden = !ok; if (ok) n++; });
    $('say').textContent = n; $('bos').hidden = !!n;
  });
})();
</script>
`;

/* ---- kategori sayfası ---- */
const sayfa = k => {
  const g = grup(k.id);
  if (!g) { console.warn('grup yok:', k.id); return null; }
  const items = g.items, kp = kapiOf(k.id), oyun = k.id === 'games';
  const url = SITE + k.yol + '/', ton = oyun ? 'var(--violet)' : kp.ton, bolum = oyun ? 'oyunlar' : kp.id;
  const baslik = `${k.baslik[0]} | erdevelop`;
  const parca = kp ? [{ n: kp.ad[0], u: SITE + kp.yol + '/' }] : [];
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: g.h.tr, url, inLanguage: 'tr', description: k.aciklama[0],
    isPartOf: { '@type': 'WebSite', name: 'erdevelop', url: SITE }, breadcrumb: ldYol([...parca, { n: g.h.tr, u: url }]),
    mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.t.tr, url: SITE + it.f.replace(/(^|\/)index\.html(?=$|#)/, '$1') })) } };
  const kardes = kp ? `<nav class="p-kardes" aria-label="Kategoriler" data-en-aria="Categories">${kp.alt.map(id => { const kk = katOf(id); return `<a href="../${kk.yol}/"${id === k.id ? ' class="on" aria-current="page"' : ''}><span data-en="${esc(kk.kisa[1])}">${esc(kk.kisa[0])}</span><small>${grup(id).items.length}</small></a>`; }).join('')}<a href="../Tools.html" data-en="Full list">Tüm liste</a></nav>` : '';
  const gorselli = oyun ? items.filter(it => ogYol(it.f)) : [], digerleri = oyun ? items.filter(it => !ogYol(it.f)) : items;
  const bahce = oyun ? `<section class="p wrap"><div class="genis"><a href="../oyunlar/" style="--ton:var(--violet)"><b data-en="Game Garden">Oyun Bahçesi</b><span data-en="Short mini games and daily puzzles in one place.">Kısa mini oyunlar ve günlük bulmacalar tek yerde.</span><u data-en="Open →">Aç →</u></a></div></section>` : '';
  return `${kafa({ baslik, aciklama: k.aciklama[0], url, ld })}
<body data-bolum="${bolum}" style="--ton:${ton}">
<header id="p-ust"></header>
<main>
  <div class="p-bas"><div class="wrap">
    ${yol([...(kp ? [{ u: `../${kp.yol}/`, t: kp.ad }] : []), { t: [g.h.tr, g.h.en] }])}
    <h1 data-en="${esc(g.h.en)}">${esc(g.h.tr)}</h1>
    <p class="lead" data-en="${esc(k.aciklama[1])}">${esc(k.aciklama[0])}</p>
    ${kardes}
  </div></div>
  <section class="p wrap">
    <div class="p-suz"><input id="q" type="search" placeholder="Bu kategoride ara…" data-en-ph="Search this category…" autocomplete="off" aria-label="Bu kategoride ara" data-en-aria="Search this category"><span id="say">${items.length}</span></div>
    <div id="liste" style="display:contents">
    ${gorselli.length ? `<div class="vitrin" style="margin-bottom:18px;--ton:${ton}">\n${gorselli.map(vitrinKart).join('\n')}\n</div>` : ''}
    <div class="kartlar">
${digerleri.map(it => kart(it)).join('\n')}
    </div>
    </div>
    <p class="p-bos" id="bos" hidden><span data-en="Nothing here matches your search.">Aramana uyan sonuç yok.</span> <a href="../Tools.html" data-en="Search all tools">Tüm araçlarda ara</a></p>
  </section>
  ${bahce}
  ${doc([g.h.tr, g.h.en], k.yazi)}
</main>
${kuyruk(SUZ.replace("'#liste > a'", "'#liste .kartlar > a, #liste .vitrin > a'"))}`;
};

/* ---- kapı sayfası: alt kategoriler ve her birinden öne çıkanlar ---- */
const kapiSayfa = h => {
  const url = SITE + h.yol + '/', baslik = `${h.baslik[0]} | erdevelop`;
  const toplam = h.alt.reduce((a, id) => a + grup(id).items.length, 0);
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h.ad[0], url, inLanguage: 'tr', description: h.aciklama[0], isPartOf: { '@type': 'WebSite', name: 'erdevelop', url: SITE }, breadcrumb: ldYol([{ n: h.ad[0], u: url }]),
    hasPart: h.alt.map(id => ({ '@type': 'CollectionPage', name: grup(id).h.tr, url: SITE + katOf(id).yol + '/' })) };
  return `${kafa({ baslik, aciklama: h.aciklama[0], url, ld })}
<body data-bolum="${h.id}" style="--ton:${h.ton}">
<header id="p-ust"></header>
<main>
  <div class="p-bas"><div class="wrap">
    ${yol([{ t: h.ad }])}
    <h1 data-en="${esc(h.ad[1])}">${esc(h.ad[0])}</h1>
    <p class="lead" data-en="${esc(h.aciklama[1])}">${esc(h.aciklama[0])}</p>
    <nav class="p-kardes" aria-label="Kategoriler" data-en-aria="Categories">${h.alt.map(id => { const kk = katOf(id); return `<a href="#${id}"><span data-en="${esc(kk.kisa[1])}">${esc(kk.kisa[0])}</span><small>${grup(id).items.length}</small></a>`; }).join('')}<a href="../Tools.html"><span data-en="Full list">Tüm liste</span><small>${toplam}</small></a></nav>
  </div></div>
${h.alt.map(id => { const g = grup(id), kk = katOf(id), n = g.items.length; return `  <section class="p wrap" id="${id}" style="scroll-margin-top:80px">
    <div class="p-sh"><h2><span data-en="${esc(g.h.en)}">${esc(g.h.tr)}</span><small>${n}</small></h2><a href="../${kk.yol}/">${n > 6 ? `<span data-en="All ${n} →">${n} aracın hepsi →</span>` : `<span data-en="Open page →">Sayfayı aç →</span>`}</a></div>
    <div class="kartlar">
${g.items.slice(0, 6).map(it => kart(it)).join('\n')}
    </div>
  </section>`; }).join('\n')}
  ${doc(h.ad, h.yazi)}
</main>
${kuyruk()}`;
};

/* ---- Öğren kapısı ---- */
const ogrenSayfa = () => {
  const h = OGREN, url = SITE + h.yol + '/', baslik = `${h.baslik[0]} | erdevelop`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h.ad[0], url, inLanguage: 'tr', description: h.aciklama[0], isPartOf: { '@type': 'WebSite', name: 'erdevelop', url: SITE }, breadcrumb: ldYol([{ n: h.ad[0], u: url }]) };
  const gruplar = h.egitim.map(grup).filter(Boolean);
  return `${kafa({ baslik, aciklama: h.aciklama[0], url, ld })}
<body data-bolum="ogren" style="--ton:${h.ton}">
<header id="p-ust"></header>
<main>
  <div class="p-bas"><div class="wrap">
    ${yol([{ t: h.ad }])}
    <h1 data-en="${esc(h.ad[1])}">${esc(h.ad[0])}</h1>
    <p class="lead" data-en="${esc(h.aciklama[1])}">${esc(h.aciklama[0])}</p>
  </div></div>
  <section class="p wrap" id="p-devam" aria-labelledby="h-devam" data-kurs="8" data-arac="0" hidden>
    <div class="p-sh"><h2 id="h-devam" data-en="Courses in progress">Devam ettiğin eğitimler</h2><a href="../egitimler/panom/" data-en="My dashboard →">Panom →</a></div>
    <div class="hizli"></div>
  </section>
  <section class="p wrap">
    <div class="genis">
${h.buyuk.filter(b => fs.existsSync(path.join(KOK, b.u, 'index.html'))).map(b => `      <a href="../${b.u}" style="--ton:${b.ton}"><b data-en="${esc(b.t[1])}">${esc(b.t[0])}</b><span data-en="${esc(b.d[1])}">${esc(b.d[0])}</span><u data-en="${esc(b.c[1])}">${esc(b.c[0])}</u></a>`).join('\n')}
    </div>
  </section>
${gruplar.map(g => `  <section class="p wrap" id="${g.id}" style="scroll-margin-top:80px">
    <div class="p-sh"><h2><span data-en="${esc(g.h.en)}">${esc(g.h.tr)}</span><small>${g.items.length}</small></h2><a href="../${g.id === 'ai' ? 'yapay-zeka/' : 'egitimler/#' + g.id}">${g.items.length > 6 ? `<span data-en="All ${g.items.length} →">${g.items.length} içeriğin hepsi →</span>` : `<span data-en="Open →">Aç →</span>`}</a></div>
    <div class="kartlar">
${g.items.slice(0, 6).map(it => kart(it)).join('\n')}
    </div>
  </section>`).join('\n')}
  ${doc(h.ad, h.yazi)}
</main>
${kuyruk()}`;
};

let n = 0;
const yaz = (yolu, html) => { if (!html) return; fs.mkdirSync(path.join(KOK, yolu), { recursive: true }); fs.writeFileSync(path.join(KOK, yolu, 'index.html'), html); n++; };
for (const k of KATEGORI) yaz(k.yol, sayfa(k));
for (const h of KAPI) yaz(h.yol, kapiSayfa(h));
yaz(OGREN.yol, ogrenSayfa());

/* ---- js/harita.json: sayfa → grup; site.js yol çubuğunu ve "benzer araçlar" kutusunu bundan kurar ---- */
{
  const temiz = f => f.replace(/[#?].*$/, '').replace(/(^|\/)index\.html$/, '$1');
  const kapilar = { araclar: { t: KAPI[0].ad, u: '/araclar/' }, muhendislik: { t: KAPI[1].ad, u: '/muhendislik/' }, oyunlar: { t: ['Oyunlar', 'Games'], u: '/tarayici-oyunlari/' }, ogren: { t: OGREN.ad, u: '/ogren/' } };
  const gruplar = {}, sayfalar = {}, ogeler = {};
  for (const g of G) {
    if (g.lock || !g.items) continue;
    const k = katOf(g.id), kp = g.id === 'games' ? 'oyunlar' : (kapiOf(g.id) || {}).id || (OGREN.egitim.includes(g.id) ? 'ogren' : null);
    if (!kp) continue;
    gruplar[g.id] = { t: [g.h.tr, g.h.en], u: k ? '/' + k.yol + '/' : g.id === 'ai' ? '/yapay-zeka/' : '/egitimler/#' + g.id, k: kp };
    ogeler[g.id] = [];
    for (const it of g.items) {
      const f = temiz(it.f); if (!f || /^https?:/.test(f) || /^(ozelaraclar|_arsiv)\//.test(f)) continue;
      if (!(f in sayfalar)) sayfalar[f] = g.id;
      if (!it.f.includes('#')) ogeler[g.id].push([f, it.t.tr, en(it.t) || it.t.tr]);
    }
  }
  fs.writeFileSync(path.join(KOK, 'js', 'harita.json'), JSON.stringify({ k: kapilar, g: gruplar, s: sayfalar, o: ogeler }));
}
console.log(`kapı ve kategori sayfaları: ${n}`);

/* ---- populer.json: ana sayfadaki "En popüler araçlar" sırası (yalnızca POPULER=1 ile; haftalık iş akışı çalıştırır) ----
   Kaynak: GoatCounter'ın herkese açık sayaç adresi (/counter/<yol>.json). Bunun çalışması için GoatCounter'da
   Settings → "Allow adding visitor counts on your website" açık olmalı. Kapalıysa ya da yeterli veri yoksa dosyaya dokunulmaz
   ve ana sayfa elle seçilmiş listeyi gösterir. Dosyaya ziyaret sayıları yazılmaz, yalnızca sıra yazılır. */
if (process.env.POPULER === '1') {
  const adaylar = [];
  for (const h of KAPI) for (const id of h.alt) for (const it of grup(id).items) { if (!it.f.includes('#') && !/^https?:/.test(it.f) && !adaylar.some(a => a.f === it.f)) adaylar.push({ f: it.f, tr: it.t.tr, en: en(it.t) || it.t.tr, i: ICON[it.i] || '', k: h.id }); }
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  let hata = 0;
  for (const a of adaylar) {
    try {
      const r = await fetch('https://erdevelop.goatcounter.com/counter/' + encodeURIComponent('/' + a.f) + '.json?start=month', { headers: { 'User-Agent': 'erdevelop-populer/1' } });
      if (r.status === 403) { console.log('populer: GoatCounter sayaç adresi kapalı (403); dosya değişmedi'); hata = 999; break; }
      a.n = r.ok ? +String((await r.json()).count || '0').replace(/\D/g, '') : 0;
    } catch (e) { a.n = 0; hata++; }
    await bekle(260);
  }
  const sirali = adaylar.filter(a => a.n > 0).sort((x, y) => y.n - x.n).slice(0, 12);
  /* veri azken sıra rastlantıya döner: 8. sıradaki araç ayda en az ESIK ziyaret almadıkça elle seçilmiş liste kalır */
  const ESIK = 25;
  if (hata < 20 && sirali.length >= 8 && sirali[7].n < ESIK) console.log(`populer: veri henüz az (8. sıra ${sirali[7].n} ziyaret, eşik ${ESIK}); dosya değişmedi`);
  else if (hata < 20 && sirali.length >= 8) {
    fs.writeFileSync(path.join(KOK, 'populer.json'), JSON.stringify({ v: new Date().toISOString().slice(0, 10), s: sirali.map(a => [a.f, a.tr, a.en, a.k, a.i]) }));
    console.log('populer.json: ' + sirali.slice(0, 8).map(a => a.f).join(', '));
  } else if (hata !== 999) console.log(`populer: yeterli veri yok (${sirali.length} sayfa, ${hata} hata); dosya değişmedi`);
}

