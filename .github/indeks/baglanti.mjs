/* Eğitim ↔ araç bağlantıları: aşağıdaki eşlemeden js/baglanti.js dosyasını üretir.
   Başlıklar Tools.html'deki kartlardan alınır; eşlemede sadece eğitim adı (egitimler/<ad>/) ve araç yolu yazılır.
   js/site.js her sayfada bu dosyayı okur: eğitimde "Bu konunun araçları", araçta "Bu konuyu öğren" kutusu çizer. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const GD = 'araclar/gelistirici.html';
const ESLEME = {
  'cephe-temelleri': ['kesif/rapor.html', 'cephe-bolme.html', 'hesapla/cephe-performans-siniflari.html'],
  'statik-temelleri': ['kesif/ruzgar.html', 'kesif/kar.html', 'kesif/sehim.html', 'hesapla/aluminyum-profil-egilme-hesaplama.html', 'hesapla/kayit-transom-hesaplama.html', 'hesapla/celik-kutu-profil-tablosu.html'],
  'cam-tasarimi': ['cam-agirlik.html', 'kesif/cam.html', 'hesapla/korkuluk-cami-hesaplama.html', 'hesapla/egik-cam-kanopi-hesaplama.html', 'kesif/isil-kirilma.html', 'hesapla/cam-performans-karsilastirma.html'],
  'isil-hesap': ['kesif/ucw.html', 'kesif/yogusma.html', 'hesapla/cam-performans-karsilastirma.html'],
  'cephe-fizigi': ['kesif/ucw.html', 'kesif/yogusma.html', 'kesif/gunes.html', 'hesapla/yagmur-suyu-hesaplama.html'],
  'ankraj-braket': ['kesif/ankraj.html', 'hesapla/civata-dubel-kapasite.html', 'hesapla/kaynak-dikisi-hesaplama.html'],
  'derz-sizdirmazlik': ['kesif/derz.html', 'kesif/genlesme.html', 'kesif/silikon.html', 'hesapla/kat-otelenmesi-cephe-hesaplama.html'],
  'aluminyum-profil': ['kesif/profil.html', 'hesapla/aluminyum-profil-egilme-hesaplama.html', 'hesapla/sac-profil-agirlik.html'],
  'cephe-malzemeleri': ['kesif/ral.html', 'araclar/renk.html', 'hesapla/boya-sarfiyat-hesaplama.html', 'hesapla/sac-profil-agirlik.html'],
  'sac-metal': ['kesif/bukum.html', 'hesapla/sac-profil-agirlik.html'],
  'gunes-kirici': ['kesif/gunes.html'],
  'havalandirmali-cephe': ['kesif/ankraj.html', 'kesif/ruzgar.html', 'kesif/bukum.html'],
  'cift-kabuk-cephe': ['kesif/ucw.html', 'kesif/gunes.html'],
  'surdurulebilir-cephe': ['kesif/ucw.html', 'hesapla/cam-performans-karsilastirma.html', 'kesif/gunes.html'],
  'pencere-kapi': ['kesif/ucw.html', 'hesapla/cephe-performans-siniflari.html'],
  'mockup-test': ['hesapla/cephe-performans-siniflari.html'],
  'cephe-montaj': ['hesapla/kat-otelenmesi-cephe-hesaplama.html', 'kesif/saha.html'],
  'cephe-metraj': ['cam-agirlik.html', 'hesapla/sac-profil-agirlik.html', 'cephe-bolme.html', 'hesapla/boya-sarfiyat-hesaplama.html'],
  'cephe-teklif-maliyet': ['hesapla/teklif-sablonu.html', 'hesapla/kar-marji-hesaplama.html', 'hesapla/proje-hizmet-hesaplama.html', 'hesapla/kdv-hesaplama.html'],
  'sozlesme-hakedis': ['hesapla/kdv-tevkifat-hesaplama.html', 'hesapla/gecikme-faizi-hesaplama.html', 'hesapla/enflasyon-hesaplama.html'],
  'cephe-proje-yonetimi': ['Planla.html', 'hesapla/is-gunu-hesaplama.html', 'hesapla/projelerim.html'],
  'imalat-resmi': ['dxf.html', 'kesif/bukum.html'],
  'teknik-resim': ['dxf.html', 'hesapla/alan-hacim-hesaplama.html'],
  'autocad': ['komutlar/autocad.html', 'dxf.html'],
  'autocad-dinamik-blok': ['komutlar/autocad.html'],
  'autolisp': ['komutlar/autocad.html'],
  'revit': ['komutlar/revit.html'], 'revit-temelleri': ['komutlar/revit.html'], 'revit-adim-adim': ['komutlar/revit.html'],
  'revit-family': ['komutlar/revit.html'], 'revit-family-30-gun': ['komutlar/revit.html'], 'revit-paftalama': ['komutlar/revit.html'],
  'revit-cephe-projesi': ['komutlar/revit.html'], 'revit-mimari-apartman': ['komutlar/revit.html'], 'revit-python': ['komutlar/revit.html'],
  'rhino': ['komutlar/rhino.html'], 'rhino-python': ['komutlar/rhino.html'], 'rhino-csharp': ['komutlar/rhino.html'],
  'grasshopper': ['komutlar/grasshopper.html', 'GrassHopper.html'], 'parametrik-cephe': ['komutlar/grasshopper.html'],
  'parametrik-modelleme': ['komutlar/grasshopper.html'], 'panelizasyon': ['komutlar/grasshopper.html', 'cephe-bolme.html'],
  'rhino-inside-revit': ['komutlar/grasshopper.html', 'komutlar/revit.html'],
  'dynamo': ['komutlar/dynamo.html', 'komutlar/revit.html'],
  'solidworks': ['komutlar/solidworks.html'], 'solidworks-denklemler': ['komutlar/solidworks.html'],
  'solidworks-vba': ['komutlar/solidworks.html'], 'solidworks-python': ['komutlar/solidworks.html'],
  'blender': ['komutlar/blender.html'],
  'bim-koordinasyon': ['komutlar/navisworks.html', 'komutlar/revit.html'], 'navisworks-cakisma': ['komutlar/navisworks.html'],
  'web-araclari': [GD + '#json', GD + '#bicim', GD + '#renk', GD + '#ikon'],
  'javascript-typescript': [GD + '#json', GD + '#regex', 'araclar/konsol.html'],
  'internet-programciligi': [GD + '#url', GD + '#bicim', 'web_analiz/index.html'],
  'linux-komut-satiri': ['araclar/konsol.html', GD + '#cron'],
  'siber-guvenlik': [GD + '#hash', GD + '#sifre', GD + '#jwt'],
  'bilgisayar-aglari': ['web_analiz/index.html', GD + '#url'],
  'git-github-pages': [GD + '#md', GD + '#ikon'],
  'python-veri-analizi': [GD + '#csv'], 'sql-veri': [GD + '#bicim', GD + '#csv'],
  'nodejs-postgresql': [GD + '#json', GD + '#jwt', GD + '#bicim'],
  'docker': ['araclar/konsol.html'],
  'excel-ileri': [GD + '#csv', 'hesapla/yuzde-hesaplama.html'], 'yapay-zeka-excel': [GD + '#csv'],
};

const tools = fs.readFileSync(path.join(KOK, 'Tools.html'), 'utf8');
const BASLIK = {};
for (const m of tools.matchAll(/\{ f: '([^']+)'(?:, fe: '[^']+')?, i: '\w+',(?: s: '\w+',)? t: \{ tr: '((?:[^'\\]|\\.)*)', en: '((?:[^'\\]|\\.)*)' \}/g))
  if (!BASLIK[m[1]]) BASLIK[m[1]] = [m[2].replace(/\\'/g, "'"), m[3].replace(/\\'/g, "'")];

const hata = [];
const egitim = {}, arac = {};
for (const [slug, liste] of Object.entries(ESLEME)) {
  const eb = BASLIK[`egitimler/${slug}/index.html`];
  if (!eb) { hata.push('eğitim kartı yok: ' + slug); continue; }
  egitim[slug] = [];
  for (const f of liste) {
    const ab = BASLIK[f];
    if (!ab || !fs.existsSync(path.join(KOK, f.split('#')[0]))) { hata.push(`araç yok: ${f} (${slug})`); continue; }
    egitim[slug].push([f, ab[0], ab[1]]);
    const yol = '/' + f.split('#')[0];
    (arac[yol] ||= []);
    if (!arac[yol].some(x => x[0] === slug)) arac[yol].push([slug, eb[0], eb[1]]);
  }
}
if (hata.length) { console.error(hata.join('\n')); process.exit(1); }

const js = `/* Otomatik üretildi: .github/indeks/baglanti.mjs. Elle düzenleme. */\nwindow.ER_BAG = ${JSON.stringify({ e: egitim, a: arac })};\n`;
fs.writeFileSync(path.join(KOK, 'js/baglanti.js'), js);
console.log(`js/baglanti.js: ${Object.keys(egitim).length} eğitim, ${Object.keys(arac).length} araç sayfası`);
