'use strict';
/* =========================================================
   Proje Hattı — cephe projeleri için süreç / bekleyen konu haritası
   Veri: tarayıcıda (localStorage) + JSON dışa/içe aktarma.
   Ekip paylaşımı için depolama katmanı (load/save) ileride
   bir sunucuya (ör. Supabase) bağlanacak şekilde ayrı tutuldu.
   ========================================================= */

const KEY = 'projeHatti.v1';
const DURUM = { baslamadi: 'Başlamadı', devam: 'Devam ediyor', onayda: 'Onayda', tamam: 'Tamamlandı' };
const ETKIN = { ...DURUM, bloke: 'Bloke', dolayli: 'Dolaylı bloke' };
const KIMDEN = ['Mimar', 'Danışman', 'İşveren', 'Saha', 'Tedarikçi', 'Statik', 'İç ekip', 'Diğer'];

/* ---------- Cephe şablonu ----------
   p:true  → her parsiyel için alt iş açılır
   dep     → bu adım başlamadan önce bitmesi gerekenler (anahtar) */
const SABLON = [
  { ad: 'Tasarım', adimlar: [
    { k: 'sistem', ad: 'Sistem detayları' },
    { k: 'statik', ad: 'Statik hesap' },
    { k: 'ankrajYer', ad: 'Ankraj yerleşim planı', dep: ['statik'] },
  ]},
  { ad: 'Mockup', adimlar: [
    { k: 'mkCizim', ad: 'Mockup çizimleri', dep: ['sistem'] },
    { k: 'mkCam', ad: 'Mockup cam siparişi', dep: ['mkCizim', 'renk'] },
    { k: 'mkProfil', ad: 'Mockup profil siparişi', dep: ['mkCizim'] },
    { k: 'mkMontaj', ad: 'Mockup imalat & montaj', dep: ['mkCam', 'mkProfil'] },
    { k: 'mkTest', ad: 'Mockup testi', dep: ['mkMontaj'] },
  ]},
  { ad: 'Onaylar', adimlar: [
    { k: 'renk', ad: 'Cam & emaye renk onayı' },
    { k: 'numune', ad: 'Malzeme / numune onayı' },
    { k: 'detayOnay', ad: 'Sistem detay onayı', p: true, dep: ['sistem'] },
  ]},
  { ad: 'Saha', adimlar: [
    { k: 'roleve', ad: 'Saha rölevesi', p: true },
    { k: 'ankrajMontaj', ad: 'Ankraj montajı', p: true, dep: ['ankrajSip'] },
  ]},
  { ad: 'İmalat Resimleri', adimlar: [
    { k: 'imalatRes', ad: 'İmalat resimleri', p: true, dep: ['roleve', 'detayOnay'] },
  ]},
  { ad: 'Siparişler', adimlar: [
    { k: 'ankrajSip', ad: 'Ankraj siparişi', p: true, dep: ['ankrajYer'] },
    { k: 'camSip', ad: 'Cam siparişi', p: true, dep: ['imalatRes', 'renk'] },
    { k: 'profilSip', ad: 'Alüminyum profil siparişi', p: true, dep: ['detayOnay'] },
    { k: 'aksesuarSip', ad: 'Aksesuar & conta siparişi', p: true, dep: ['detayOnay'] },
  ]},
  { ad: 'İmalat', adimlar: [
    { k: 'imalat', ad: 'Panel imalatı', p: true, dep: ['imalatRes', 'camSip', 'profilSip', 'aksesuarSip'] },
  ]},
  { ad: 'Sevkiyat & Montaj', adimlar: [
    { k: 'sevk', ad: 'Sevkiyat', p: true, dep: ['imalat'] },
    { k: 'montaj', ad: 'Montaj', p: true, dep: ['sevk', 'ankrajMontaj', 'mkTest'] },
  ]},
];
const SABLON_DEP = {};
SABLON.forEach(a => a.adimlar.forEach(s => SABLON_DEP[s.k] = s));

/* ---------- şablon kütüphanesi ----------
   Her şablon: aşamalar/adımlar (p:true → her grup için alt iş), grup adı
   (Parsiyel, Ders, Modül…), varsayılan gruplar, "kimden bekleniyor" listesi ve etiketler. */
const GENEL_KIMDEN = ['Ekip', 'Müşteri', 'Yönetici', 'Tedarikçi', 'Kendim', 'Diğer'];
const SABLONLAR = [
  { id: 'cephe', ikon: '▦', ad: 'Cephe projesi', aciklama: 'Tasarım → mockup → onaylar → saha → imalat resimleri → siparişler → imalat → montaj',
    grupAdi: 'Parsiyel', gruplar: ['A', 'B'], kimden: KIMDEN, etiketler: null, asamalar: SABLON,
    ornek: { bekleyen: [['renk', null, 'Mimar', 'Emaye boya RAL kodu ve baskı deseni'], ['roleve', 1, 'Saha', 'Kuzey cephe 3-5. kat ankraj rölevesi'], ['detayOnay', 1, 'Danışman', 'Köşe detayı revizyon onayı']],
      not: [['renk', 'Mimara 3 numune gönderildi, toplantıda karar verilecek.']] } },

  { id: 'ders', ikon: '✎', ad: 'Ders / sınav takibi', aciklama: 'Hedef ve program → konu çalışma → soru çözümü → aralıklı tekrar → deneme',
    grupAdi: 'Ders', gruplar: ['Matematik', 'Türkçe', 'Fen Bilimleri', 'İnkılap Tarihi', 'İngilizce', 'Din Kültürü'],
    kimden: ['Öğretmen', 'Veli', 'Kurs / Etüt', 'Arkadaş', 'Kendim', 'Diğer'], etiketler: ['Konu', 'Soru', 'Tekrar', 'Deneme', 'Video', 'Ödev'],
    soz: { adim: 'Çalışma', adimlar: 'Çalışmalar', bekleyen: 'Eksik / soru', bekleyenler: 'Eksikler ve sorular', bekleyenSekme: 'Eksikler', bekliyorEtiket: 'eksik',
      soruYer: 'Ne eksik ya da kime sorulacak?', durum: { baslamadi: 'Başlamadı', devam: 'Çalışılıyor', onayda: 'Kontrolde', tamam: 'Bitti' },
      bloke: 'Takıldı', dolayli: 'Öncekine bağlı', takili: 'önceki çalışmaya bağlı' },
    asamalar: [
      { ad: 'Hedef ve plan', adimlar: [{ k: 'hedef', ad: 'Hedef puan / not belirle' }, { k: 'program', ad: 'Haftalık çalışma programı', dep: ['hedef'] },
        { k: 'kaynak', ad: 'Kaynak ve kitap seçimi', p: true, dep: ['hedef'] }] },
      { ad: 'Konu çalışma', adimlar: [{ k: 'anlatim', ad: 'Konu anlatımı (ders / video)', p: true, dep: ['program', 'kaynak'], e: ['Konu', 'Video'] },
        { k: 'ozet', ad: 'Özet / not çıkarma', p: true, dep: ['anlatim'], e: ['Konu'] }, { k: 'kavram', ad: 'Kavram haritası', p: true, dep: ['ozet'], e: ['Konu'] }] },
      { ad: 'Soru çözümü', adimlar: [{ k: 'temel', ad: 'Temel sorular', p: true, dep: ['anlatim'], e: ['Soru'] }, { k: 'yeninesil', ad: 'Yeni nesil sorular', p: true, dep: ['temel'], e: ['Soru'] },
        { k: 'cikmis', ad: 'Çıkmış sorular', p: true, dep: ['yeninesil'], e: ['Soru'] }, { k: 'yanlis', ad: 'Yanlış analizi', p: true, dep: ['cikmis'], e: ['Soru'] }] },
      { ad: 'Aralıklı tekrar', adimlar: [{ k: 't1', ad: '1. tekrar (1 gün sonra)', p: true, dep: ['ozet'], e: ['Tekrar'] }, { k: 't2', ad: '2. tekrar (1 hafta sonra)', p: true, dep: ['t1'], e: ['Tekrar'] },
        { k: 't3', ad: '3. tekrar (1 ay sonra)', p: true, dep: ['t2'], e: ['Tekrar'] }] },
      { ad: 'Deneme', adimlar: [{ k: 'brans', ad: 'Branş denemesi', p: true, dep: ['yanlis'], e: ['Deneme'] }, { k: 'genel', ad: 'Genel deneme', dep: ['brans'], e: ['Deneme'] },
        { k: 'danaliz', ad: 'Deneme analizi ve eksik listesi', dep: ['genel'], e: ['Deneme'] }] },
    ],
    ornek: { bekleyen: [['yeninesil', 0, 'Öğretmen', 'Grafik okuma sorularında takılıyorum, derste sorulacak'], ['kaynak', 2, 'Veli', 'Fen soru bankası alınacak'],
      ['ozet', 1, 'Kendim', 'Paragraf konusunun özet notları eksik']], not: [['hedef', 'Hedef: tüm derslerde en az %80 net.']] } },

  { id: 'konu', ikon: '◎', ad: 'Konu öğrenme / araştırma', aciklama: 'Hedef ve kaynak → okuma ve not → uygulama → pekiştirme → kendini test etme',
    grupAdi: 'Alt konu', gruplar: ['Temeller', 'Orta seviye', 'İleri seviye'], kimden: ['Uzman', 'Kaynak / kitap', 'Danışman', 'Topluluk / forum', 'Kendim', 'Diğer'],
    etiketler: ['Okuma', 'Video', 'Uygulama', 'Not'],
    soz: { adim: 'Görev', adimlar: 'Görevler', bekleyen: 'Açık soru', bekleyenler: 'Açık sorular', bekleyenSekme: 'Açık sorular', bekliyorEtiket: 'soru',
      soruYer: 'Ne netleşmeli?', durum: { baslamadi: 'Başlamadı', devam: 'Öğreniliyor', onayda: 'Gözden geçiriliyor', tamam: 'Öğrenildi' },
      bloke: 'Takıldı', dolayli: 'Öncekine bağlı', takili: 'önceki göreve bağlı' },
    asamalar: [
      { ad: 'Keşif', adimlar: [{ k: 'hedef', ad: 'Neden öğreniyorum? Hedef ve kapsam' }, { k: 'onbilgi', ad: 'Ön bilgi kontrolü', dep: ['hedef'] },
        { k: 'kaynak', ad: 'Kaynak listesi (kitap, video, makale)', dep: ['hedef'] }] },
      { ad: 'Öğrenme', adimlar: [{ k: 'oku', ad: 'Oku / izle', p: true, dep: ['kaynak'], e: ['Okuma', 'Video'] }, { k: 'not', ad: 'Not al', p: true, dep: ['oku'], e: ['Not'] },
        { k: 'kavram', ad: 'Anahtar kavramlar', p: true, dep: ['not'], e: ['Not'] }] },
      { ad: 'Uygulama', adimlar: [{ k: 'uygula', ad: 'Örnek çöz / uygula', p: true, dep: ['kavram'], e: ['Uygulama'] }, { k: 'mini', ad: 'Mini proje', dep: ['uygula'], e: ['Uygulama'] }] },
      { ad: 'Pekiştirme', adimlar: [{ k: 'kozet', ad: 'Özet / zihin haritası', dep: ['kavram'], e: ['Not'] }, { k: 'tekrar', ad: 'Aralıklı tekrar', p: true, dep: ['not'] },
        { k: 'anlat', ad: 'Birine anlat / paylaş', dep: ['kozet'] }] },
      { ad: 'Değerlendirme', adimlar: [{ k: 'test', ad: 'Kendini test et', dep: ['mini', 'tekrar'] }, { k: 'eksik', ad: 'Eksikleri kapat', dep: ['test'] }] },
    ],
    ornek: { bekleyen: [['uygula', 0, 'Uzman', 'Örnekteki adım neden bu sırayla yapılıyor?'], ['oku', 2, 'Kaynak / kitap', 'İleri seviye bölüm için güncel kaynak bulunamadı']],
      not: [['hedef', '3 ay içinde temel konuları kendi başıma uygulayabilmek.']] } },

  { id: 'yazilim', ikon: '⌘', ad: 'Yazılım / ürün geliştirme', aciklama: 'Keşif → tasarım → geliştirme ve birim test → entegrasyon ve kabul → yayın',
    grupAdi: 'Modül', gruplar: ['Arayüz', 'Sunucu', 'Mobil'], kimden: ['Müşteri', 'Ekip', 'Tasarımcı', 'Test', 'Yönetici', 'Diğer'],
    etiketler: ['Özellik', 'Hata', 'Tasarım', 'Test', 'Teknik borç'],
    soz: { asama: 'Faz', asamalar: 'Fazlar', adim: 'Görev', adimlar: 'Görevler', bekleyen: 'Engel', bekleyenler: 'Engeller', bekleyenSekme: 'Engeller', bekliyorEtiket: 'engel',
      soruYer: 'Ne engelliyor?', durum: { baslamadi: 'Yapılacak', devam: 'Geliştiriliyor', onayda: 'İncelemede', tamam: 'Bitti' },
      bloke: 'Engelli', dolayli: 'Bağımlılık bekliyor', takili: 'bağımlılık bekliyor' },
    asamalar: [
      { ad: 'Keşif', adimlar: [{ k: 'paydas', ad: 'Paydaş görüşmeleri' }, { k: 'gereksinim', ad: 'Gereksinimler', dep: ['paydas'] }, { k: 'kapsam', ad: 'Kapsam ve öncelikler', dep: ['gereksinim'] }] },
      { ad: 'Tasarım', adimlar: [{ k: 'ekran', ad: 'Ekran / akış tasarımı', p: true, dep: ['kapsam'], e: ['Tasarım'] }, { k: 'veri', ad: 'Veri modeli', dep: ['kapsam'], e: ['Tasarım'] },
        { k: 'mimari', ad: 'Mimari', dep: ['veri'], e: ['Tasarım'] }, { k: 'tonay', ad: 'Tasarım onayı', dep: ['ekran', 'mimari'], e: ['Tasarım'] }] },
      { ad: 'Geliştirme', adimlar: [{ k: 'kod', ad: 'Geliştirme', p: true, dep: ['tonay'], e: ['Özellik'] }, { k: 'birim', ad: 'Birim testleri', p: true, dep: ['kod'], e: ['Test'] },
        { k: 'inceleme', ad: 'Kod incelemesi', p: true, dep: ['birim'] }] },
      { ad: 'Test', adimlar: [{ k: 'entegrasyon', ad: 'Entegrasyon testi', dep: ['inceleme'], e: ['Test'] }, { k: 'kabul', ad: 'Kullanıcı kabul testi', dep: ['entegrasyon'], e: ['Test'] },
        { k: 'duzelt', ad: 'Hata düzeltme', p: true, dep: ['kabul'], e: ['Hata'] }] },
      { ad: 'Yayın', adimlar: [{ k: 'notlar', ad: 'Sürüm notları', dep: ['duzelt'] }, { k: 'yayin', ad: 'Yayına alma', dep: ['notlar'] }, { k: 'izleme', ad: 'İzleme ve geri bildirim', dep: ['yayin'] }] },
    ],
    ornek: { bekleyen: [['ekran', 2, 'Tasarımcı', 'Ödeme ekranının mobil hali bekleniyor'], ['kod', 1, 'Müşteri', 'Ödeme sağlayıcısının test anahtarı gelmedi'],
      ['veri', null, 'Müşteri', 'Raporlama ihtiyacı netleşmedi']], not: [['kapsam', 'İlk sürümde web ve sunucu; mobil ikinci sürümde.']] } },

  { id: 'etkinlik', ikon: '✦', ad: 'Etkinlik / organizasyon', aciklama: 'Planlama → tedarik → davet → son hazırlık → etkinlik günü → kapanış',
    grupAdi: 'Alan', gruplar: ['Mekân', 'İkram', 'Müzik / ses', 'Süsleme'], kimden: ['Tedarikçi', 'Mekân', 'Davetli', 'Ekip', 'Kendim', 'Diğer'],
    etiketler: ['Rezervasyon', 'Ödeme', 'Satın alma', 'İletişim'],
    soz: { adim: 'Görev', adimlar: 'Görevler', durum: { baslamadi: 'Yapılacak', devam: 'Sürüyor', onayda: 'Onay bekliyor', tamam: 'Tamam' } },
    asamalar: [
      { ad: 'Planlama', adimlar: [{ k: 'amac', ad: 'Amaç ve konsept' }, { k: 'tarih', ad: 'Tarih, saat ve bütçe', dep: ['amac'] }, { k: 'gorev', ad: 'Görev dağılımı', dep: ['tarih'] }] },
      { ad: 'Tedarik', adimlar: [{ k: 'teklif', ad: 'Teklif al', p: true, dep: ['tarih'], e: ['Satın alma'] }, { k: 'secim', ad: 'Karşılaştır ve seç', p: true, dep: ['teklif'] },
        { k: 'sozlesme', ad: 'Rezervasyon / kapora', p: true, dep: ['secim'], e: ['Rezervasyon', 'Ödeme'] }] },
      { ad: 'Davet', adimlar: [{ k: 'liste', ad: 'Davetli listesi', dep: ['amac'] }, { k: 'davet', ad: 'Davetiye gönder', dep: ['liste', 'tarih'], e: ['İletişim'] },
        { k: 'lcv', ad: 'Katılım teyidi (LCV)', dep: ['davet'], e: ['İletişim'] }] },
      { ad: 'Son hazırlık', adimlar: [{ k: 'teyit', ad: 'Tedarikçi teyidi', p: true, dep: ['sozlesme'], e: ['İletişim'] }, { k: 'akis', ad: 'Akış planı', dep: ['lcv'] },
        { k: 'kontrol', ad: 'Son kontrol listesi', dep: ['teyit', 'akis'] }] },
      { ad: 'Etkinlik günü', adimlar: [{ k: 'kurulum', ad: 'Kurulum', dep: ['kontrol'] }, { k: 'egun', ad: 'Etkinlik', dep: ['kurulum'] }, { k: 'toplama', ad: 'Toplama', dep: ['egun'] }] },
      { ad: 'Kapanış', adimlar: [{ k: 'odeme', ad: 'Kalan ödemeler', p: true, dep: ['egun'], e: ['Ödeme'] }, { k: 'tesekkur', ad: 'Teşekkür mesajları', dep: ['egun'], e: ['İletişim'] },
        { k: 'degerlendirme', ad: 'Değerlendirme notları', dep: ['toplama'] }] },
    ],
    ornek: { bekleyen: [['secim', 1, 'Tedarikçi', 'Menü fiyatı ve tadım tarihi'], ['lcv', null, 'Davetli', '12 kişiden yanıt gelmedi']],
      not: [['amac', 'Yaklaşık 80 kişi; akşam yemeği ve canlı müzik.']] } },

  { id: 'bos', ikon: '○', ad: 'Boş proje', aciklama: 'Kendi aşamalarını, adımlarını ve gruplarını sıfırdan kur',
    grupAdi: 'Grup', gruplar: [], kimden: GENEL_KIMDEN, etiketler: [], asamalar: [{ ad: 'Başlangıç', adimlar: [] }],
    soz: { durum: { baslamadi: 'Yapılacak', devam: 'Devam ediyor', onayda: 'Beklemede', tamam: 'Tamamlandı' } } },
];
// şablonun dili: durum adları, "bekleyen konu" kavramı, aşama/adım adları
const SOZ_VARSAYILAN = { asama: 'Aşama', asamalar: 'Aşamalar', adim: 'Adım', adimlar: 'Adımlar', bekleyen: 'Bekleyen konu', bekleyenler: 'Bekleyen konular',
  bekleyenSekme: 'Bekleyenler', bekliyorEtiket: 'bekleyen', soruYer: 'Ne bekleniyor?', bloke: 'Bloke', dolayli: 'Dolaylı bloke', takili: 'önceki işe takılı',
  durum: { baslamadi: 'Başlamadı', devam: 'Devam ediyor', onayda: 'Onayda', tamam: 'Tamamlandı' } };
function SOZ() {
  const p = typeof S !== 'undefined' && S && P(), sb = p && SABLONLAR.find(s => s.id === (p.sablon || 'cephe')), z = (sb && sb.soz) || {};
  return { ...SOZ_VARSAYILAN, ...z, durum: { ...SOZ_VARSAYILAN.durum, ...(z.durum || {}) } };
}
// projeye uygun hızlı not örneği (ör. #temel-matematik @ogretmen …)
function ornekNot() {
  const p = P(), z = SOZ(), k = kimdenler()[0] || 'Ekip';
  const kelime = s => katla(String(s).split(/\s+/)[0]);
  if (!p.sablon || p.sablon === 'cephe') return { bek: '#cam-B @mimar emaye rengi', tamam: '#röleve-A !tamam', bekAciklama: 'B parsiyeli cam işine “Mimar’dan bekleniyor” açar' };
  const adim = p.nodes.find(n => n.perP && p.nodes.some(x => x.parentId === n.id)) || p.nodes.find(n => n.parentId), g = p.parsiyels[0];
  const ilk = adim || p.nodes[0];
  const etiket = ilk ? '#' + kelime(ilk.title) + (adim && g && adim.perP ? '-' + kelime(g) : '') : '#iş-adı';
  return { bek: `${etiket} @${kelime(k)} …`, tamam: `${etiket} !tamam`, bekAciklama: `${ilk ? `“${ilk.title}”${adim && g && adim.perP ? ` (${g})` : ''} işine` : 'o işe'} “${den(k)} bekleniyor” diye ${kucuk(z.bekleyen)} açar` };
}
function sozUygula() {
  const z = SOZ();
  Object.assign(DURUM, z.durum); Object.assign(ETKIN, z.durum, { bloke: z.bloke, dolayli: z.dolayli });
  const r = document.querySelector('#views [data-v="rapor"]'); if (r) r.textContent = z.bekleyenSekme;
  const q = document.getElementById('quickIn');
  if (q && P()) { const o = ornekNot(); q.placeholder = `Komut ya da hızlı not…   ör.  git ${o.tamam.slice(1).split(/[-\s]/)[0]}  ·  dikey  ·  daralt hepsi  ·  ${o.bek}  ·  ? yardım`; }
}
const kucuk = s => String(s).toLocaleLowerCase('tr');
const sablonBul = id => SABLONLAR.find(s => s.id === id) || ((typeof S !== 'undefined' && S && S.sablonlar) || []).find(s => s.id === id);
function sablonDep(id) { const d = {}; const sb = SABLONLAR.find(s => s.id === id); (sb ? sb.asamalar : SABLON).forEach(a => a.adimlar.forEach(s => d[s.k] = s)); return d; }
// projenin grup adı (Parsiyel, Ders, Modül…) ve çoğulu
const GA = () => (P() && P().grupAdi) || 'Parsiyel';
const cogul = s => { const sesli = String(s).toLocaleLowerCase('tr').match(/[aeıioöuü]/g); return s + (sesli && /[aıou]/.test(sesli[sesli.length - 1]) ? 'lar' : 'ler'); };
const kimdenler = () => (P() && P().kimden && P().kimden.length ? P().kimden : KIMDEN);
// "Mimar'dan", "Öğretmen'den", "Veli'den", "Tedarikçi'den" — ünlü uyumu ve sert ünsüz
const den = s => { const k = String(s).trim(), kk = k.toLocaleLowerCase('tr'), sesli = kk.match(/[aeıioöuüâîû]/g);
  const kalin = sesli && /[aıouâû]/.test(sesli[sesli.length - 1]), sert = /[fstkçşhp]$/.test(kk);
  return k + "'" + (sert ? 't' : 'd') + (kalin ? 'an' : 'en'); };
const kacis = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- yardımcılar ---------- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// uzun, boşluksuz adlar (001_ABCD_BLOK...) ayraçlardan sonra alt satıra geçebilsin
const escK = s => esc(s).replace(/([_\/.\-–])/g, '$1<wbr>');
const norm = s => String(s || '').toLocaleLowerCase('tr').replace(/[^0-9a-zçğıöşü]/g, '');
const $ = s => document.querySelector(s);
const now = () => Date.now();
const gunOnce = t => { const g = Math.floor((now() - t) / 864e5); return g <= 0 ? 'bugün' : g + ' gün'; };
const tarih = t => new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ---------- depolama katmanı ---------- */
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.projects)) return d; } catch (e) {}
  return null;
}
function save() {
  gecmisKaydet();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Kaydedilemedi: ' + e.message); }
}

/* ---------- geri al / yinele (son 10 adım, bu oturum boyunca) ----------
   Her kayıtta projelerin önceki hali yığına atılır. Yalnızca proje
   değiştirmek (activeId) bir adım sayılmaz. */
const GECMIS_SINIR = 10;
let geriYigin = [], ileriYigin = [], sonDurum = null, sonMesaj = '';
const durumMetni = () => JSON.stringify(S.projects);
function gecmisKaydet() {
  const simdi = durumMetni();
  if (sonDurum === null) { sonDurum = simdi; return; }   // ilk kayıt: başlangıç noktası
  if (simdi === sonDurum) return;                        // gerçek değişiklik yok
  geriYigin.push({ d: sonDurum, m: sonMesaj || 'Değişiklik' });
  log(sonMesaj || 'Değişiklik', 'islem', ui.sel);
  if (geriYigin.length > GECMIS_SINIR) geriYigin.shift();
  ileriYigin = []; sonDurum = simdi; sonMesaj = '';
  gecmisDugmeleri();
}
function gecmisUygula(kaynak, hedef, ad) {
  if (!kaynak.length) { toast(ad === 'geri' ? 'Geri alınacak adım yok' : 'Yinelenecek adım yok'); return; }
  const adim = kaynak.pop();
  hedef.push({ d: sonDurum, m: adim.m });
  S.projects = JSON.parse(adim.d); sonDurum = adim.d;
  if (!S.projects.some(p => p.id === S.activeId)) S.activeId = S.projects[0].id;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  render(); gecmisDugmeleri();
  toast((ad === 'geri' ? '↶ Geri alındı: ' : '↷ Yinelendi: ') + adim.m + (kaynak.length ? `  (${kaynak.length} adım daha)` : ''));
}
const geriAl = () => gecmisUygula(geriYigin, ileriYigin, 'geri');
const yinele = () => gecmisUygula(ileriYigin, geriYigin, 'ileri');
function gecmisDugmeleri() {
  const g = document.getElementById('btnGeri'), i = document.getElementById('btnIleri'); if (!g) return;
  g.disabled = !geriYigin.length; i.disabled = !ileriYigin.length;
  g.title = geriYigin.length ? `Geri al: ${geriYigin[geriYigin.length - 1].m} (Ctrl+Z) — ${geriYigin.length} adım` : 'Geri alınacak adım yok (Ctrl+Z)';
  i.title = ileriYigin.length ? `Yinele: ${ileriYigin[ileriYigin.length - 1].m} (Ctrl+Y) — ${ileriYigin.length} adım` : 'Yinelenecek adım yok (Ctrl+Y)';
}

/* ---------- proje oluşturma ---------- */
function yeniProje(ad, parsiyeller, sablonId = 'cephe') {
  const sb = sablonBul(sablonId) || SABLONLAR[0];
  if (sb.ozel) return ozelSablondanProje(ad, parsiyeller, sb);
  const p = { id: uid(), name: ad, parsiyels: parsiyeller.slice(), nodes: [], blockers: [], notes: [],
    sablon: sb.id, grupAdi: sb.grupAdi, kimden: sb.kimden.slice() };
  if (sb.etiketler) p.tags = sb.etiketler.slice();
  const ets = s => sb.etiketler ? (s.e || []).slice() : undefined; // cephede etiketler addan otomatik
  sb.asamalar.forEach((a, i) => {
    const asama = node(p, { title: a.ad, parentId: null, order: i, tags: sb.etiketler ? [] : undefined });
    a.adimlar.forEach((s, j) => {
      const adim = node(p, { title: s.ad, parentId: asama.id, order: j, tkey: s.k, perP: !!s.p, tags: ets(s) });
      if (s.p) parsiyeller.forEach((ps, k) => node(p, { title: s.ad + ' – ' + ps, parentId: adim.id, order: k, tkey: s.k, parsiyel: ps, tags: sb.etiketler ? [] : undefined }));
    });
  });
  const DEP = sablonDep(sb.id);
  p.nodes.forEach(n => n.deps = sablonBag(p, n, DEP));
  etiketTamamla(p);
  return p;
}
function node(p, o) {
  const n = { id: uid(), parentId: null, title: '', status: 'baslamadi', parsiyel: '', deps: [], order: 0, ...o };
  p.nodes.push(n); return n;
}
// şablondaki bağımlılıkları gerçek düğümlere çevirir
function sablonBag(p, n, DEP = SABLON_DEP) {
  if (!n.tkey) return [];
  if (n.perP && !n.parsiyel) return []; // parsiyelli adımın kendisi: bağımlılık alt işlerde
  const t = DEP[n.tkey]; if (!t || !t.dep) return [];
  const out = [];
  t.dep.forEach(k => {
    const hedef = DEP[k];
    let d;
    if (hedef && hedef.p && n.parsiyel) d = p.nodes.find(x => x.tkey === k && x.parsiyel === n.parsiyel);
    if (!d) d = p.nodes.find(x => x.tkey === k && !x.parsiyel);
    if (d) out.push(d.id);
  });
  return out;
}
// yeni grup: her gruplu adıma bir alt iş eklenir; bağımlılıklar mevcut bir grubun
// bağlarından kopyalanır (aynı gruptaki işlere giden bağlar yeni gruba çevrilir)
function parsiyelEkle(p, ad) {
  if (p.parsiyels.includes(ad)) return;
  const ornek = p.parsiyels[0];
  p.parsiyels.push(ad);
  const map = new Map(p.nodes.map(n => [n.id, n]));
  const yeni = new Map(), yeniler = [];
  p.nodes.filter(n => n.perP && !n.parsiyel).forEach(adim => {
    const kids = p.nodes.filter(x => x.parentId === adim.id);
    const proto = ornek !== undefined ? kids.find(x => x.parsiyel === ornek) : null;
    const kok = proto ? proto.title.replace(new RegExp('\\s*–\\s*' + kacis(ornek) + '$'), '') : adim.title;
    const n = node(p, { title: kok + ' – ' + ad, parentId: adim.id, order: kids.length, tkey: adim.tkey, parsiyel: ad,
      tags: proto && Array.isArray(proto.tags) ? proto.tags.slice() : undefined });
    yeniler.push(n); if (proto) yeni.set(proto.id, n);
  });
  if (yeni.size) yeni.forEach((n, pid) => n.deps = (map.get(pid).deps || []).map(d => yeni.has(d) ? yeni.get(d).id : d));
  else { const DEP = sablonDep(p.sablon || 'cephe'); yeniler.forEach(n => n.deps = sablonBag(p, n, DEP)); }
}
// grubu sil: gruplu adımların o gruba ait alt işleri (ve altları) silinir, diğer işlerde grup işareti kalkar
function parsiyelSilinecek(p, ad) {
  const map = new Map(p.nodes.map(n => [n.id, n])), sil = new Set();
  p.nodes.forEach(n => { if (n.parsiyel === ad && n.parentId && map.get(n.parentId) && map.get(n.parentId).perP) sil.add(n.id); });
  let degisti = true; while (degisti) { degisti = false; p.nodes.forEach(n => { if (!sil.has(n.id) && sil.has(n.parentId)) { sil.add(n.id); degisti = true; } }); }
  return sil;
}
function parsiyelSil(p, ad) {
  const sil = parsiyelSilinecek(p, ad);
  p.nodes = p.nodes.filter(n => !sil.has(n.id));
  p.nodes.forEach(n => { n.deps = (n.deps || []).filter(d => !sil.has(d)); if (n.parsiyel === ad) n.parsiyel = ''; });
  p.blockers = p.blockers.filter(b => !sil.has(b.nodeId)); p.notes = p.notes.filter(b => !sil.has(b.nodeId));
  p.parsiyels = p.parsiyels.filter(x => x !== ad);
}
function parsiyelAdlandir(p, eski, yeni) {
  if (!yeni || eski === yeni || p.parsiyels.includes(yeni)) return false;
  p.parsiyels = p.parsiyels.map(x => x === eski ? yeni : x);
  const son = new RegExp('(\\s*–\\s*)' + kacis(eski) + '$');
  p.nodes.forEach(n => { if (n.parsiyel === eski) { n.parsiyel = yeni; n.title = n.title.replace(son, '$1' + yeni); } });
  return true;
}
// projeyi şablon olarak sakla (durumlar sıfırlanır; bekleyen konular ve notlar alınmaz)
function sablonaKaydet(p, ad) {
  const yid = new Map(p.nodes.map(n => [n.id, uid()]));
  const nodes = p.nodes.map(n => ({ ...JSON.parse(JSON.stringify(n)), id: yid.get(n.id), parentId: n.parentId ? yid.get(n.parentId) : null,
    deps: (n.deps || []).map(d => yid.get(d)).filter(Boolean), status: 'baslamadi' }));
  const asamaSay = nodes.filter(n => !n.parentId).length;
  S.sablonlar.push({ id: 'oz_' + uid(), ozel: true, ikon: '★', ad, aciklama: `"${p.name}" projesinden · ${asamaSay} aşama, ${nodes.length} iş`,
    grupAdi: p.grupAdi || 'Parsiyel', gruplar: p.parsiyels.slice(), kimden: (p.kimden || KIMDEN).slice(), etiketler: (p.tags || []).slice(), sablonKaynak: p.sablon || 'cephe', nodes });
}
// şablona uygun örnek veriler: işlerin ~%30'u bitmiş, birkaçı sürüyor, birkaç bekleyen ve not
function ornekVeriEkle(p, sb) {
  const o = sb.ornek; if (!o) return;
  const C0 = hesapla(p), sira = [];
  const gez = pid => C0.kids(pid).forEach(n => { if (!C0.kids(n.id).length) sira.push(n); gez(n.id); }); gez(null);
  const n1 = Math.floor(sira.length * 0.3);
  sira.forEach((n, i) => n.status = i < n1 ? 'tamam' : i < n1 + 2 ? 'devam' : i === n1 + 2 ? 'onayda' : 'baslamadi');
  if (window.planHesapla) planHesapla(p, { basGun: bugunGun() - 24, sure: (window.SURE_VARS && SURE_VARS[sb.id]) || 3, haftaSonu: true, hepsi: true });
  sira.forEach(n => { if (n.status === 'tamam') n.tamamAt = n.bit && window.gunNo ? Math.min(now(), (gunNo(n.bit) + 1) * 864e5) : now() - 7 * 864e5; });
  const bul = (k, gi) => p.nodes.find(n => n.tkey === k && (gi == null ? !n.parsiyel : n.parsiyel === p.parsiyels[gi]));
  const t = now();
  (o.bekleyen || []).forEach(([k, gi, kim, txt], j) => {
    const n = bul(k, gi) || bul(k, null); if (!n) return;
    if (n.status === 'tamam') n.status = 'devam';
    p.blockers.push({ id: uid(), nodeId: n.id, kimden: kim, text: txt, at: t - (2 + j * 4) * 864e5, closed: false });
  });
  (o.not || []).forEach(([k, txt]) => { const n = bul(k, null) || p.nodes.find(x => x.tkey === k); if (n) p.notes.push({ id: uid(), nodeId: n.id, text: txt, at: t - 6 * 864e5 }); });
}
function ozelSablondanProje(ad, gruplar, sb) {
  const yid = new Map(sb.nodes.map(n => [n.id, uid()]));
  const p = { id: uid(), name: ad, parsiyels: sb.gruplar.slice(), blockers: [], notes: [], sablon: sb.sablonKaynak || 'cephe',
    grupAdi: sb.grupAdi, kimden: sb.kimden.slice(), tags: sb.etiketler.slice(),
    nodes: sb.nodes.map(n => ({ ...JSON.parse(JSON.stringify(n)), id: yid.get(n.id), parentId: n.parentId ? yid.get(n.parentId) : null, deps: (n.deps || []).map(d => yid.get(d)).filter(Boolean) })) };
  // istenen gruplara uydur: çıkanları sil, yenileri ekle, sırayı ayarla
  sb.gruplar.filter(g => !gruplar.includes(g)).forEach(g => parsiyelSil(p, g));
  gruplar.filter(g => !p.parsiyels.includes(g)).forEach(g => parsiyelEkle(p, g));
  p.parsiyels = gruplar.slice();
  etiketTamamla(p);
  return p;
}

function ornekProje() {
  const p = yeniProje('Örnek Proje', ['A', 'B', 'C']);
  const f = (k, ps = '') => p.nodes.find(n => n.tkey === k && n.parsiyel === ps);
  const set = (k, ps, st) => { const n = f(k, ps); if (n) n.status = st; };
  set('sistem', '', 'tamam'); set('statik', '', 'tamam'); set('ankrajYer', '', 'tamam');
  set('mkCizim', '', 'tamam'); set('mkProfil', '', 'devam'); set('numune', '', 'onayda');
  ['A', 'B', 'C'].forEach(x => set('detayOnay', x, 'onayda'));
  set('detayOnay', 'A', 'tamam'); set('roleve', 'A', 'tamam'); set('imalatRes', 'A', 'devam');
  set('ankrajSip', 'A', 'tamam'); set('ankrajSip', 'B', 'devam');
  const t = now();
  p.blockers.push({ id: uid(), nodeId: f('renk').id, kimden: 'Mimar', text: 'Emaye boya RAL kodu ve baskı deseni', at: t - 12 * 864e5, closed: false });
  p.blockers.push({ id: uid(), nodeId: f('roleve', 'B').id, kimden: 'Saha', text: 'Kuzey cephe 3-5. kat ankraj rölevesi', at: t - 4 * 864e5, closed: false });
  p.blockers.push({ id: uid(), nodeId: f('detayOnay', 'C').id, kimden: 'Danışman', text: 'C parsiyeli köşe detayı revizyon onayı', at: t - 7 * 864e5, closed: false });
  p.notes.push({ id: uid(), nodeId: f('renk').id, text: 'Mimara 3 numune gönderildi, toplantıda karar verilecek.', at: t - 9 * 864e5 });
  return p;
}

/* ---------- durum hesabı ---------- */
/* ---------- etiketler ----------
   Bir iş hatta tek yerde durur (aşama = zaman sırası) ama birden çok etiket taşır
   (Sipariş, Cam, Mockup…). Etiketler üst aşamadan alt işlere miras geçer. */
const ETIKET_VARSAYILAN = ['Sipariş', 'Onay', 'Çizim', 'Saha', 'İmalat', 'Mockup'];
function otoEtiket(baslik) {
  const t = String(baslik || '').toLocaleLowerCase('tr'), r = [];
  if (/sipariş/.test(t)) r.push('Sipariş');
  if (/onay/.test(t)) r.push('Onay');
  else if (/çizim|resim|detay|plan/.test(t)) r.push('Çizim');
  if (/röleve|saha|^montaj|ankraj montaj/.test(t)) r.push('Saha');
  if (/imalat/.test(t) && !/resim/.test(t)) r.push('İmalat');
  if (/mockup/.test(t)) r.push('Mockup');
  return r;
}
// etiketi hiç belirlenmemiş işlere adından etiket ver (üstten miras gelenleri tekrar etmeden)
function etiketTamamla(p) {
  if (!Array.isArray(p.tags)) p.tags = ETIKET_VARSAYILAN.slice();
  const map = new Map(p.nodes.map(n => [n.id, n]));
  const derin = n => { let d = 0, x = n; while (x && x.parentId && d < 50) { x = map.get(x.parentId); d++; } return d; };
  const miras = n => { const s = new Set(); let x = map.get(n.parentId); while (x) { (x.tags || []).forEach(t => s.add(t)); x = map.get(x.parentId); } return s; };
  p.nodes.slice().sort((a, b) => derin(a) - derin(b)).forEach(n => {
    if (Array.isArray(n.tags)) return;
    const m = miras(n); n.tags = otoEtiket(n.title).filter(t => !m.has(t));
  });
  p.nodes.forEach(n => n.tags.forEach(t => { if (!p.tags.includes(t)) p.tags.push(t); }));
}
const renk = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.codePointAt(0)) % 360; return h; };
const etkHTML = (t, ek = '') => `<span class="etk ${ek}" style="--h:${renk(t)}">${esc(t)}</span>`;

let C = null; // hesaplanmış indeks (her render'da yenilenir)
function hesapla(p) {
  const map = new Map(p.nodes.map(n => [n.id, n]));
  const ch = new Map();
  p.nodes.forEach(n => { if (!ch.has(n.parentId)) ch.set(n.parentId, []); ch.get(n.parentId).push(n); });
  ch.forEach(l => l.sort((a, b) => a.order - b.order));
  const ob = new Map();
  p.blockers.filter(b => !b.closed).forEach(b => { if (!ob.has(b.nodeId)) ob.set(b.nodeId, []); ob.get(b.nodeId).push(b); });
  const eff = new Map(), ziyaret = new Set();
  const kotu = s => s === 'bloke' || s === 'dolayli';

  function E(id) {
    if (eff.has(id)) return eff.get(id);
    if (ziyaret.has(id)) return 'baslamadi'; // döngü koruması
    ziyaret.add(id);
    const n = map.get(id); if (!n) { ziyaret.delete(id); return 'baslamadi'; }
    const kids = ch.get(id) || [];
    const direkt = (ob.get(id) || []).length > 0;
    const depKotu = (n.deps || []).some(d => kotu(E(d)));
    let r;
    if (kids.length) {
      const ks = kids.map(k => E(k.id));
      if (direkt) r = 'bloke';
      else if (ks.every(s => s === 'tamam')) r = 'tamam';
      else if (ks.includes('bloke')) r = 'bloke';
      else if (ks.includes('dolayli') || depKotu) r = 'dolayli';
      else if (ks.filter(s => s !== 'tamam').every(s => s === 'onayda')) r = 'onayda';
      else if (ks.some(s => s !== 'baslamadi')) r = 'devam';
      else r = 'baslamadi';
    } else {
      if (n.status === 'tamam') r = 'tamam';
      else if (direkt) r = 'bloke';
      else if (depKotu) r = 'dolayli';
      else r = n.status || 'baslamadi';
    }
    ziyaret.delete(id); eff.set(id, r); return r;
  }
  p.nodes.forEach(n => E(n.id));
  // etkin etiketler: kendi + üstlerden miras
  const etk = new Map();
  const T = id => { if (etk.has(id)) return etk.get(id); const n = map.get(id); const s = new Set(n && n.parentId && map.has(n.parentId) && n.parentId !== id ? T(n.parentId) : []); (n && n.tags || []).forEach(t => s.add(t)); etk.set(id, s); return s; };
  p.nodes.forEach(n => T(n.id));
  return { map, ch, ob, eff, etk, kids: id => ch.get(id) || [] };
}
const ata = id => { const out = []; let n = C.map.get(id); while (n && n.parentId) { n = C.map.get(n.parentId); if (n) out.unshift(n); } return out; };
const yol = id => ata(id).map(n => n.title).join(' › ');
const altlar = id => { const out = []; const w = i => C.kids(i).forEach(k => { out.push(k); w(k.id); }); w(id); return out; };
const yapraklar = id => { const a = altlar(id).filter(n => !C.kids(n.id).length); return a.length ? a : [C.map.get(id)]; };

// bir düğüme takılan (dolaylı etkilenen) işler
function etkilenen(id) {
  const P_ = P(); const set = new Set([id, ...ata(id).map(n => n.id)]);
  const sonuc = new Set(); let degisti = true;
  while (degisti) {
    degisti = false;
    P_.nodes.forEach(n => {
      if (sonuc.has(n.id) || set.has(n.id) && n.id === id) return;
      if ((n.deps || []).some(d => set.has(d) || sonuc.has(d)) && C.eff.get(n.id) !== 'tamam') {
        sonuc.add(n.id); ata(n.id).forEach(a => set.add(a.id)); degisti = true;
      }
    });
  }
  return [...sonuc].map(i => C.map.get(i)).filter(n => !C.kids(n.id).length);
}

/* ---------- uygulama durumu ---------- */
let S = load();
if (!S || !S.projects.length) { S = { version: 1, projects: [ornekProje()], activeId: null }; }
if (!S.activeId || !S.projects.some(p => p.id === S.activeId)) S.activeId = S.projects[0].id;
S.projects.forEach(etiketTamamla);
if (!Array.isArray(S.sablonlar)) S.sablonlar = [];
save();

const ui = { view: 'hat', zoom: 2, sel: null, parsiyel: '*', bag: 'sorunlu', etiket: '*', kureDon: true,
  dikey: (() => { try { return localStorage.getItem('projeHatti.yon') === 'dikey'; } catch (e) { return false; } })(),
  cam: { x: 0, y: 0, s: window.innerWidth < 860 ? 0.6 : 0.9 } };
// yakınlığa göre ayrıntı seviyesi (harita gibi: yaklaştıkça detay artar)
const seviye = s => s < 0.5 ? 1 : s < 1.1 ? 2 : 3;
const ONAYAR = { 1: 0.42, 2: 0.85, 3: 1.2 };
ui.zoom = seviye(ui.cam.s);
function P() { return S.projects.find(p => p.id === S.activeId) || S.projects[0]; }

/* ---------- çizim ---------- */
// sol panel: açık / kapalı (tarayıcıda hatırlanır)
let panelAcik = (() => { try { return localStorage.getItem('projeHatti.panel') !== 'kapali'; } catch (e) { return true; } })();
function paneliAyarla(acik) {
  panelAcik = acik;
  try { localStorage.setItem('projeHatti.panel', acik ? 'acik' : 'kapali'); } catch (e) {}
  const L = $('#layout'), onceAcik = !L.classList.contains('kapali');
  L.classList.toggle('kapali', !acik);
  // panel genişliği değişince harita yerinde kalsın (masaüstü yerleşimde)
  if (onceAcik !== acik && L.dataset.hazir && window.innerWidth > 860) { ui.cam.x += acik ? -306 : 306; kameraUygula(); }
  L.dataset.hazir = '1';
  const b = $('#btnSide');
  b.textContent = acik ? '‹' : (ui.sel ? '› ' + (C && C.map.get(ui.sel) ? C.map.get(ui.sel).title : 'Panel') : '› Panel');
  b.title = acik ? 'Paneli kapat' : 'Paneli aç';
}

const haritaMi = () => ui.view === 'hat' || ui.view === 'zihin' || ui.view === 'ag';
function render() {
  // hat ve zihin haritasının kameraları ayrı tutulur
  if (ui._sonView !== ui.view) {
    ui.camlar = ui.camlar || {};
    if (ui._sonView) ui.camlar[ui._sonView] = ui.cam;
    const ilk = haritaMi() && !ui.camlar[ui.view] && ui._sonView;
    if (ui.camlar[ui.view]) ui.cam = ui.camlar[ui.view];
    ui.zoom = seviye(ui.cam.s); ui._sonView = ui.view;
    if (ilk) requestAnimationFrame(() => haritaMi() && sigdir());
  }
  sozUygula();
  C = hesapla(P());
  if (ui.sel && !C.map.has(ui.sel)) ui.sel = null;
  renderProjeler(); renderToolbar(); renderGorunum(); renderYan(); paneliAyarla(panelAcik);
}

function renderProjeler() {
  $('#projSel').innerHTML = S.projects.map(p => `<option value="${p.id}" ${p.id === S.activeId ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === ui.view));
}

function seg(name, val, opts) {
  return `<div class="seg" data-seg="${name}">${opts.map(([v, t]) => `<button data-val="${esc(v)}" class="${String(val) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
}
const lejant = () => `<div class="legend">${Object.entries(ETKIN).map(([k, v]) => `<span><i class="dot s-${k}"></i>${esc(v)}</span>`).join('')}</div>`;

function renderToolbar() {
  const p = P(); let h = '';
  if (ui.view === 'hat' || ui.view === 'zihin') {
    if (ui.view === 'hat') h += `<button class="btn sm yon-btn" id="btnYon" title="Hattı ${ui.dikey ? 'yataya' : 'dikeye'} çevir">${ui.dikey ? '⇅ Dikey' : '⇄ Yatay'}</button>`;
    h += `<button class="btn sm" id="btnHepsiDar" title="Tümünü daralt">⊟ Tümünü daralt</button><button class="btn sm" id="btnHepsiAc" title="Tümünü genişlet">⊞ Tümünü genişlet</button>`;
    h += 'Yakınlık ' + seg('zoom', ui.zoom, [[1, esc(SOZ().asamalar)], [2, esc(SOZ().adimlar)], [3, esc(cogul(GA()))]]) + `<span id="zoomPct" style="min-width:38px">%${Math.round(ui.cam.s * 100)}</span><button class="btn sm" id="btnFit" title="Tüm hattı ekrana sığdır (boş yere çift tık)">Sığdır</button>`;
    if (p.parsiyels.length) h += esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]);
    h += 'Bağlantılar ' + seg('bag', ui.bag, [['sorunlu', 'Sorunlu'], ['tum', 'Tümü'], ['yok', 'Kapalı']]);
  }
  if (ui.view === 'kure') {
    if (p.parsiyels.length) h += esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]);
    h += 'Bağlantılar ' + seg('bag', ui.bag, [['sorunlu', 'Sorunlu'], ['tum', 'Tümü'], ['yok', 'Kapalı']]);
    h += `<button class="btn sm" id="btnKureOrtala" title="Kameranın görüşünü tüm küreye döndür">Ortala</button>
      <button class="btn sm" id="btnKureDon" title="Boştayken yavaşça dönsün mü">${ui.kureDon ? 'Dönüş: açık' : 'Dönüş: kapalı'}</button>`;
  }
  if (ui.view === 'agac') {
    h += `<button class="btn sm" id="btnHepsiDar" title="Tümünü daralt">⊟ Tümünü daralt</button><button class="btn sm" id="btnHepsiAc" title="Tümünü genişlet">⊞ Tümünü genişlet</button>`;
    h += `Düzey <div class="seg"><button data-duzey="1">${esc(SOZ().asamalar)}</button><button data-duzey="2">${esc(SOZ().adimlar)}</button><button data-duzey="9">Tümü</button></div>`;
    if (p.parsiyels.length) h += esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]);
    h += `<span class="small">↑↓ gez · ←→ aç/kapa · çift tık: yeniden adlandır · sürükle: taşı</span>`;
  }
  if (window.GORUNUM && GORUNUM[ui.view] && GORUNUM[ui.view].arac) h += GORUNUM[ui.view].arac();
  if (haritaMi() || ui.view === 'liste' || ui.view === 'kure' || ui.view === 'agac' || (window.GORUNUM && GORUNUM[ui.view] && GORUNUM[ui.view].etiket)) {
    if (ui.etiket !== '*' && !p.tags.includes(ui.etiket)) ui.etiket = '*';
    h += `<span class="tbg">Etiket ${seg('etiket', ui.etiket, [['*', 'Tümü'], ...p.tags.map(t => [t, esc(t)])])}</span>`;
  }
  if (ui.view === 'rapor') {
    h += `<button class="btn sm" id="btnCopy">Metni kopyala</button><button class="btn sm" id="btnPrint">Yazdır / PDF</button>`;
  }
  if (pano && haritaMi()) h += `<span class="pano-chip">Panoda: <b>${esc(pano.baslik)}</b> (${pano.nodes.length} iş) · yapıştırmak için bir + işaretine tıkla <button class="x" id="btnPanoTemizle" title="Panoyu temizle (Esc)">✕</button></span>`;
  $('#toolbar').innerHTML = h + lejant();
  document.body.classList.toggle('pano', !!pano);
}

function renderGorunum() {
  const v = $('#viewport');
  v.classList.toggle('harita', haritaMi());
  v.classList.toggle('kure-acik', ui.view === 'kure');
  if (ui.view === 'kure') {
    // 3B sahne her çizimde yeniden kurulmaz; kap korunur, sahne veriden güncellenir
    if (!v.querySelector('#kure3d')) v.innerHTML = '<div id="kure3d" class="kure"></div>';
    window.kureGuncelle ? window.kureGuncelle() : (v.querySelector('#kure3d').textContent = 'kure.js yüklenemedi');
    return;
  }
  if (ui.view === 'hat') { v.innerHTML = hatHTML(); kameraUygula(); requestAnimationFrame(baglantilariCiz); }
  else if (ui.view === 'zihin') { v.innerHTML = zihinHTML(); kameraUygula(); requestAnimationFrame(baglantilariCiz); }
  else if (ui.view === 'matris') v.innerHTML = matrisHTML();
  else if (ui.view === 'liste') v.innerHTML = listeHTML();
  else if (ui.view === 'agac') { v.innerHTML = agacHTML(); const s = v.querySelector('.ag-satir.sel'); if (s && ui.agacKaydir) { s.scrollIntoView({ block: 'nearest' }); ui.agacKaydir = false; } }
  else if (window.GORUNUM && GORUNUM[ui.view]) GORUNUM[ui.view].ciz(v);
  else v.innerHTML = raporHTML();
}

/* --- HAT --- */
function dagilim(id) {
  const y = yapraklar(id); const say = {};
  y.forEach(n => { const s = C.eff.get(n.id); say[s] = (say[s] || 0) + 1; });
  return { y, say };
}
function barHTML(id) {
  const { y, say } = dagilim(id);
  return `<div class="bar">${['tamam', 'onayda', 'devam', 'dolayli', 'bloke', 'baslamadi'].filter(k => say[k]).map(k => `<i class="s-${k}" style="width:${say[k] / y.length * 100}%"></i>`).join('')}</div>`;
}
const gorunur = n => ui.parsiyel === '*' || !n.parsiyel || n.parsiyel === ui.parsiyel;

// etiket filtresi açıkken eşleşen işler ve onların üstleri net, diğerleri soluk
let netler = null;
function netlerHesapla() {
  netler = null; if (ui.etiket === '*') return;
  netler = new Set();
  P().nodes.forEach(n => { if (C.etk.get(n.id).has(ui.etiket)) { netler.add(n.id); ata(n.id).forEach(a => netler.add(a.id)); } });
}
const soluk = id => netler && !netler.has(id) ? 'soluk' : '';
function hatHTML() {
  netlerHesapla();
  const asamalar = C.kids(null);
  let h = `<div class="hat-inner zoom${ui.zoom} ${ui.dikey ? 'dikey' : ''}" id="hatInner"><svg class="links" id="links"></svg><div class="hat-line"></div>`;
  h += `<div class="endcap"><i></i>BAŞLANGIÇ</div>`;
  const arti = i => `<div class="ins"><button data-ins="${i}" title="Buraya yeni aşama ekle">+</button></div>`;
  asamalar.forEach((a, i) => {
    h += arti(i);
    const e = C.eff.get(a.id);
    const { y, say } = dagilim(a.id);
    const bek = y.reduce((t, n) => t + (C.ob.get(n.id) || []).length, 0) + (C.ob.get(a.id) || []).length;
    h += `<div class="station s-${e}">
      <div class="st-head ${ui.sel === a.id ? 'sel' : ''} ${soluk(a.id)}" data-id="${a.id}">
        <div class="big"></div>
        <div class="st-title" title="${esc(a.title)}">${C.kids(a.id).length ? `<button class="dar" data-dar="${a.id}" title="${kapali.has(a.id) ? 'Genişlet' : 'Daralt'}">${kapali.has(a.id) ? '▸' : '▾'}</button>` : ''}${escK(a.title)}</div>
        <div class="st-sub">${say.tamam || 0}/${y.length} tamam${bek ? ` · <span style="color:var(--s-bloke)">${bek} ${esc(SOZ().bekliyorEtiket)}</span>` : ''}</div>
        ${barHTML(a.id)}
      </div>`;
    if (ui.zoom >= 2 && kapali.has(a.id)) {
      const say = C.kids(a.id).length;
      h += `<div class="kapali-not" data-dar="${a.id}" title="Genişlet">▸ ${say} adım gizli</div>`;
    } else if (ui.zoom >= 2) {
      // kartların arasına, üstüne ve altına "+": o noktaya adım ekler
      const artiAdim = once => `<div class="ins-s"><button data-adim="${a.id}" data-once="${once}" title="Buraya adım ekle">+</button></div>`;
      const kartlar = C.kids(a.id).filter(n => gorunur(n) && (!C.kids(n.id).length || C.kids(n.id).some(gorunur)));
      h += `<div class="steps">`;
      kartlar.forEach(s => h += artiAdim(s.id) + kartHTML(s));
      h += artiAdim('') + `</div>`;
    }
    h += `</div>`;
  });
  h += arti(asamalar.length) + `<div class="endcap"><i></i>TESLİM</div></div>`;
  return h;
}
function rozetler(n) {
  const r = [];
  const bek = (C.ob.get(n.id) || []).length;
  const altBek = altlar(n.id).reduce((t, k) => t + (C.ob.get(k.id) || []).length, 0);
  if (bek + altBek) r.push(`<span class="tag red">${bek + altBek} ${esc(SOZ().bekliyorEtiket)}</span>`);
  const e = C.eff.get(n.id);
  if (e === 'dolayli') r.push(`<span class="tag orn">${esc(SOZ().takili)}</span>`);
  if (C.kids(n.id).length) { const { y, say } = dagilim(n.id); r.push(`<span class="tag">${say.tamam || 0}/${y.length}</span>`); }
  const nt = P().notes.filter(x => x.nodeId === n.id).length;
  if (nt) r.push(`<span class="tag">${nt} not</span>`);
  if (window.tarihRozet) r.push(tarihRozet(n));
  return r.join('');
}
function kartHTML(n) {
  const e = C.eff.get(n.id);
  let h = `<div class="card s-${e} ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}">
    <div class="c-t" title="${esc(n.title)}">${ui.zoom >= 3 && C.kids(n.id).length ? `<button class="dar" data-dar="${n.id}" title="${kapali.has(n.id) ? 'Genişlet' : 'Daralt'}">${kapali.has(n.id) ? '▸' : '▾'}</button>` : ''}${escK(n.title)}</div><div class="c-m"><span>${ETKIN[e]}</span>${rozetler(n)}</div>
    ${(n.tags || []).length ? `<div class="c-e">${n.tags.map(t => etkHTML(t)).join('')}</div>` : ''}`;
  if (ui.zoom >= 3 && C.kids(n.id).length && !kapali.has(n.id)) {
    h += `<div class="chips">` + C.kids(n.id).filter(gorunur).map(k => {
      const ek = C.eff.get(k.id);
      return `<span class="chip ${ek === 'bloke' ? 'red' : ''} ${ui.sel === k.id ? 'sel' : ''} ${soluk(k.id)}" data-id="${k.id}" title="${esc(k.title)} — ${ETKIN[ek]}"><i class="dot s-${ek}"></i>${escK(k.parsiyel || k.title)}</span>`;
    }).join('') + `</div>`;
  }
  return h + `</div>`;
}

function baglantilariCiz() {
  if (ui.view === 'zihin') return zihinBaglar();
  if (ui.view === 'ag') return;
  const svg = $('#links'), kap = $('#hatInner'); if (!svg || !kap) return;
  const kr = kap.getBoundingClientRect(), sc = ui.cam.s;
  // dönüşümlü (ölçekli) kaptan yerel koordinata çevir
  const lr = el => { const r = el.getBoundingClientRect(); return { left: (r.left - kr.left) / sc, right: (r.right - kr.left) / sc, top: (r.top - kr.top) / sc, width: r.width / sc, height: r.height / sc }; };
  svg.setAttribute('width', kap.scrollWidth); svg.setAttribute('height', kap.scrollHeight);
  if (ui.bag === 'yok' && !ui.sel) { svg.innerHTML = ''; return; }
  const elOf = id => { let n = C.map.get(id); while (n) { const el = kap.querySelector(`[data-id="${n.id}"]`); if (el) return el; n = C.map.get(n.parentId); } return null; };
  const kenar = new Map();
  P().nodes.forEach(x => (x.deps || []).forEach(d => {
    const ed = C.eff.get(d), ex = C.eff.get(x.id);
    const sorunlu = (ed === 'bloke' || ed === 'dolayli') && ex !== 'tamam';
    const secili = ui.sel && (x.id === ui.sel || d === ui.sel);
    if (!secili && (ui.bag === 'yok' || (ui.bag === 'sorunlu' && !sorunlu))) return;
    const a = elOf(d), b = elOf(x.id); if (!a || !b || a === b) return;
    if (!gorunur(C.map.get(x.id)) && ui.parsiyel !== '*') return;
    const key = a.dataset.id + '>' + b.dataset.id;
    const renk = secili ? 'sec' : ed === 'bloke' && sorunlu ? 'bloke' : sorunlu ? 'dolayli' : 'normal';
    const sira = { sec: 3, bloke: 2, dolayli: 1, normal: 0 };
    const k0 = kenar.get(key);
    if (!k0 || sira[renk] > sira[k0.renk]) kenar.set(key, { a, b, renk });
  }));
  const R = { sec: 'var(--accent)', bloke: 'var(--s-bloke)', dolayli: 'var(--s-dolayli)', normal: 'var(--link-normal)' };
  let h = '<defs>' + Object.entries(R).map(([k, c]) => `<marker id="ok-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
  const sirali = [...kenar.values()].sort((x, y) => (x.renk === 'normal') - (y.renk === 'normal')).reverse();
  sirali.forEach(({ a, b, renk }) => {
    if (a.classList.contains('st-head') && b.classList.contains('st-head')) {
      // iki aşama arası: hattın üstünden kavis
      const ca = lr(a.querySelector('.big')), cb = lr(b.querySelector('.big'));
      if (ui.dikey) { // hattın solundan kavis
        const x = ca.left, y1 = ca.top + ca.height / 2, y2 = cb.top + cb.height / 2, sol = Math.min(55, 16 + Math.abs(y2 - y1) * 0.08);
        h += `<path d="M${x} ${y1} C${x - sol} ${y1},${x - sol} ${y2},${x} ${y2}" fill="none" stroke="${R[renk]}" stroke-width="2" ${renk === 'normal' ? 'stroke-dasharray="4 4"' : ''} marker-end="url(#ok-${renk})" opacity=".9"/>`;
        return;
      }
      const x1 = ca.left + ca.width / 2, x2 = cb.left + cb.width / 2, y = ca.top;
      const yuk = Math.min(55, 16 + Math.abs(x2 - x1) * 0.08);
      h += `<path d="M${x1} ${y} C${x1} ${y - yuk},${x2} ${y - yuk},${x2} ${y}" fill="none" stroke="${R[renk]}" stroke-width="2" ${renk === 'normal' ? 'stroke-dasharray="4 4"' : ''} marker-end="url(#ok-${renk})" opacity=".9"/>`;
      return;
    }
    const ra = lr(a), rb = lr(b);
    if (ui.dikey && !(rb.left > ra.right + 10 && Math.abs(rb.top - ra.top) < ra.height)) {
      let d;
      if (rb.top > ra.top + ra.height + 5) { // aşağıdaki satıra: alttan üste
        const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height, x2 = rb.left + rb.width / 2, y2 = rb.top, dy = Math.max(30, (y2 - y1) / 2);
        d = `M${x1} ${y1} C${x1} ${y1 + dy},${x2} ${y2 - dy},${x2} ${y2}`;
      } else { // aynı satırda geriye ya da yukarıya: alttan dolaşan yay
        const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height, x2 = rb.left + rb.width / 2, y2 = rb.top + rb.height, o = 40 + Math.abs(x2 - x1) * 0.15;
        d = `M${x1} ${y1} C${x1} ${y1 + o},${x2} ${y2 + o},${x2} ${y2}`;
      }
      h += `<path d="${d}" fill="none" stroke="${R[renk]}" stroke-width="${renk === 'normal' ? 1.2 : 2}" ${renk === 'normal' ? 'stroke-dasharray="4 4"' : ''} marker-end="url(#ok-${renk})" opacity=".9"/>`;
      return;
    }
    let x1 = ra.right, y1 = ra.top + ra.height / 2;
    let x2 = rb.left, y2 = rb.top + rb.height / 2;
    let d;
    if (x2 > x1 + 10) { const dx = Math.max(30, (x2 - x1) / 2); d = `M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}`; }
    else { // aynı sütun ya da geriye: sağdan dolaşan yay
      x2 = rb.right; const o = 40 + Math.abs(y2 - y1) * 0.15;
      d = `M${x1} ${y1} C${x1 + o} ${y1},${x2 + o} ${y2},${x2} ${y2}`;
    }
    h += `<path d="${d}" fill="none" stroke="${R[renk]}" stroke-width="${renk === 'normal' ? 1.2 : 2}" ${renk === 'normal' ? 'stroke-dasharray="4 4"' : ''} marker-end="url(#ok-${renk})" opacity=".9"/>`;
  });
  svg.innerHTML = h;
}

/* --- ZİHİN HARİTASI ---
   Ortada proje; aşamalar iki yana dallanır (sağda yukarıdan aşağı, solda aşağıdan yukarı,
   yani saat yönünde), adımlar aşamanın ucunda, gruplar yaklaşınca adımın yanında çip. */
function zihinHTML() {
  netlerHesapla();
  const p = P(), z = ui.zoom, H = 40, ARA = 22;
  const asamalar = C.kids(null);
  const adimlar = a => C.kids(a.id).filter(n => gorunur(n) && (!C.kids(n.id).length || C.kids(n.id).some(gorunur)));
  const acik = a => z >= 2 && !kapali.has(a.id);
  const satir = a => acik(a) ? Math.max(1, adimlar(a).length) : 1;
  const blok = a => satir(a) * H + ARA;
  const yarim = Math.ceil(asamalar.length / 2);
  const sag = asamalar.slice(0, yarim), sol = asamalar.slice(yarim).reverse();
  const top = l => l.reduce((t, a) => t + blok(a), 0);
  const X1 = 190, X2 = X1 + 260, KOL = (z >= 3 ? 560 : 320);
  const W = 2 * (X2 + KOL) + 80, Hh = Math.max(top(sag), top(sol), 160) + 140, cx = W / 2, cy = Hh / 2;
  let h = `<div class="hat-inner zihin zoom${z}" id="hatInner" style="width:${W}px;height:${Hh}px"><svg class="links" id="links"></svg>`;
  h += `<div class="zd zd-kok" style="left:${cx}px;top:${cy}px">${escK(p.name)}</div>`;
  const yerlestir = (liste, yon) => {
    let y = cy - top(liste) / 2;
    const isaret = yon === 'sag' ? 1 : -1;
    liste.forEach(a => {
      const bh = blok(a), ay = y + bh / 2, e = C.eff.get(a.id), { y: yap, say } = dagilim(a.id), kids = C.kids(a.id);
      const bek = yap.reduce((t, n) => t + (C.ob.get(n.id) || []).length, 0) + (C.ob.get(a.id) || []).length;
      const dar = kids.length ? `<button class="dar" data-dar="${a.id}" title="${kapali.has(a.id) ? 'Genişlet' : 'Daralt'}">${kapali.has(a.id) ? '▸' : '▾'}</button>` : '';
      h += `<div class="zd zd-asama ${yon} s-${e} ${ui.sel === a.id ? 'sel' : ''} ${soluk(a.id)}" data-id="${a.id}" data-ust="" style="left:${cx + isaret * X1}px;top:${ay}px">
        ${yon === 'sag' ? dar : ''}<span class="zd-t">${escK(a.title)}</span><small>${say.tamam || 0}/${yap.length}${bek ? ` · <b class="zd-bek">${bek}</b>` : ''}</small>
        ${z >= 2 && kapali.has(a.id) && kids.length ? `<span class="zd-gizli" data-dar="${a.id}">+${kids.length}</span>` : ''}${yon === 'sol' ? dar : ''}</div>`;
      if (acik(a)) adimlar(a).forEach((s, i) => {
        const sy = y + ARA / 2 + i * H + H / 2, es = C.eff.get(s.id), sk = C.kids(s.id).filter(gorunur);
        const nb = [s, ...altlar(s.id)].reduce((t, n) => t + (C.ob.get(n.id) || []).length, 0);
        const cipler = z >= 3 && sk.length && !kapali.has(s.id)
          ? `<span class="zd-cipler">${sk.map(k => `<span class="chip ${C.eff.get(k.id) === 'bloke' ? 'red' : ''} ${ui.sel === k.id ? 'sel' : ''} ${soluk(k.id)}" data-id="${k.id}" title="${esc(k.title)} — ${ETKIN[C.eff.get(k.id)]}"><i class="dot s-${C.eff.get(k.id)}"></i>${escK(k.parsiyel || k.title)}</span>`).join('')}</span>` : '';
        const ozet = sk.length && !cipler ? `<small>${sk.filter(k => C.eff.get(k.id) === 'tamam').length}/${sk.length}</small>` : '';
        h += `<div class="zd zd-adim ${yon} s-${es} ${ui.sel === s.id ? 'sel' : ''} ${soluk(s.id)}" data-id="${s.id}" data-ust="${a.id}" style="left:${cx + isaret * X2}px;top:${sy}px">
          <i class="dot s-${es}"></i><span class="zd-t" title="${esc(s.title)}">${escK(s.title)}</span>${nb ? `<b class="zd-bek">${nb}</b>` : ''}${ozet}${cipler}</div>`;
      });
      y += bh;
    });
  };
  yerlestir(sag, 'sag'); yerlestir(sol, 'sol');
  return h + `</div>`;
}
function zihinBaglar() {
  const svg = $('#links'), kap = $('#hatInner'); if (!svg || !kap) return;
  const kr = kap.getBoundingClientRect(), sc = ui.cam.s;
  const lr = el => { const r = el.getBoundingClientRect(); return { l: (r.left - kr.left) / sc, r: (r.right - kr.left) / sc, t: (r.top - kr.top) / sc, b: (r.bottom - kr.top) / sc }; };
  svg.setAttribute('width', kap.offsetWidth); svg.setAttribute('height', kap.offsetHeight);
  const kok = lr(kap.querySelector('.zd-kok'));
  let h = '';
  // dallar: üstten alta yumuşak eğriler, renk alttaki işin durumu
  kap.querySelectorAll('.zd[data-ust]').forEach(el => {
    const c = lr(el), sagda = el.classList.contains('sag');
    const u = el.dataset.ust ? lr(kap.querySelector(`.zd[data-id="${el.dataset.ust}"]`)) : kok;
    const x1 = sagda ? u.r : u.l, y1 = (u.t + u.b) / 2, x2 = sagda ? c.l : c.r, y2 = (c.t + c.b) / 2, dx = (x2 - x1) / 2;
    const e = C.eff.get(el.dataset.id), kalin = el.dataset.ust ? 1.8 : 3.2, sol = el.classList.contains('soluk') ? 0.12 : 0.55;
    h += `<path d="M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}" fill="none" stroke="var(--s-${e})" stroke-width="${kalin}" stroke-linecap="round" opacity="${sol}"/>`;
  });
  // bağımlılıklar (hat ile aynı filtre)
  const R = { sec: 'var(--accent)', bloke: 'var(--s-bloke)', dolayli: 'var(--s-dolayli)', normal: 'var(--link-normal)' };
  const elOf = id => { let n = C.map.get(id); while (n) { const el = kap.querySelector(`[data-id="${n.id}"]`); if (el) return el; n = C.map.get(n.parentId); } return null; };
  const kenar = new Map();
  if (!(ui.bag === 'yok' && !ui.sel)) P().nodes.forEach(x => (x.deps || []).forEach(d => {
    const ed = C.eff.get(d), ex = C.eff.get(x.id);
    const sorunlu = (ed === 'bloke' || ed === 'dolayli') && ex !== 'tamam';
    const secili = ui.sel && (x.id === ui.sel || d === ui.sel);
    if (!secili && (ui.bag === 'yok' || (ui.bag === 'sorunlu' && !sorunlu))) return;
    const a = elOf(d), b = elOf(x.id); if (!a || !b || a === b) return;
    const tur = secili ? 'sec' : ed === 'bloke' && sorunlu ? 'bloke' : sorunlu ? 'dolayli' : 'normal';
    const sira = { sec: 3, bloke: 2, dolayli: 1, normal: 0 }, k = a.dataset.id + '>' + b.dataset.id, k0 = kenar.get(k);
    if (!k0 || sira[tur] > sira[k0.tur]) kenar.set(k, { a, b, tur });
  }));
  let defs = '<defs>' + Object.entries(R).map(([k, c]) => `<marker id="zok-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
  kenar.forEach(({ a, b, tur }) => {
    const ra = lr(a), rb = lr(b);
    const x1 = (ra.l + ra.r) / 2, y1 = (ra.t + ra.b) / 2, x2 = (rb.l + rb.r) / 2, y2 = (rb.t + rb.b) / 2;
    // kavis merkeze doğru (haritanın içinden geçsin)
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, kx = mx + ((kok.l + kok.r) / 2 - mx) * 0.35, ky = my + ((kok.t + kok.b) / 2 - my) * 0.35;
    h += `<path d="M${x1} ${y1} Q${kx} ${ky},${x2} ${y2}" fill="none" stroke="${R[tur]}" stroke-width="${tur === 'normal' ? 1.2 : 1.8}" stroke-dasharray="${tur === 'sec' ? '' : '5 4'}" marker-end="url(#zok-${tur})" opacity=".85"/>`;
  });
  svg.innerHTML = defs + h;
}

/* --- AĞAÇ: girintili, dosya gezgini gibi --- */
function agacGorunenler() {
  // ekranda görünen satırların sırası (klavyeyle gezinmek için)
  const out = [];
  const gez = (pid, d) => C.kids(pid).filter(n => gorunur(n) && (!C.kids(n.id).length || C.kids(n.id).some(gorunur) || !n.perP)).forEach(n => {
    out.push({ n, d }); if (C.kids(n.id).length && !kapali.has(n.id)) gez(n.id, d + 1);
  });
  gez(null, 0); return out;
}
function agacHTML() {
  netlerHesapla();
  const p = P(), satirlar = agacGorunenler();
  let h = `<div class="agac" id="agac"><div class="ag-bas"><span>Ad</span><span>Durum</span><span>İlerleme</span><span>Tarih</span><span>${esc(SOZ().bekleyenSekme)}</span><span>Not</span></div>`;
  if (!satirlar.length) h += `<div class="empty-note">Henüz iş yok. Sağ tıkla → Yeni aşama ekle.</div>`;
  satirlar.forEach(({ n, d }) => {
    const e = C.eff.get(n.id), kids = C.kids(n.id), acik = !kapali.has(n.id);
    const bek = (C.ob.get(n.id) || []).length + altlar(n.id).reduce((t, k) => t + (C.ob.get(k.id) || []).length, 0);
    const nt = p.notes.filter(x => x.nodeId === n.id).length;
    let ilerleme = '';
    if (kids.length) { const { y, say } = dagilim(n.id); ilerleme = `${barHTML(n.id)}<small>${say.tamam || 0}/${y.length}</small>`; }
    h += `<div class="ag-satir s-${e} ${!n.parentId ? 'ag-asama' : ''} ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}" style="--d:${d}">
      <span class="ag-ad">${kids.length ? `<button class="ag-ac" data-dar="${n.id}" title="${acik ? 'Daralt' : 'Genişlet'}">${acik ? '▾' : '▸'}</button>` : '<span class="ag-bosluk"></span>'}
        <i class="dot s-${e}"></i><span class="ag-t" data-agad="${n.id}">${escK(n.title)}</span>
        ${n.parsiyel && !(C.map.get(n.parentId) || {}).perP ? `<span class="tag">${esc(n.parsiyel)}</span>` : ''}
        ${(n.tags || []).map(t => etkHTML(t, 'kucuk')).join('')}
        ${kids.length && !acik ? `<span class="ag-gizli">${kids.length}</span>` : ''}</span>
      <span class="ag-durum">${ETKIN[e]}</span>
      <span class="ag-ilerleme">${ilerleme}</span>
      <span class="ag-tarih">${window.tarihHucre ? tarihHucre(n) : ''}</span>
      <span>${bek ? `<b class="zd-bek">${bek}</b>` : ''}</span>
      <span class="small">${nt || ''}</span></div>`;
  });
  return h + `</div>`;
}
function agacDuzey(d) {
  // 1: yalnızca aşamalar, 2: adımlar açık (alt işler kapalı), 9: hepsi açık
  const derinlik = n => ata(n.id).length;
  P().nodes.forEach(n => { if (!C.kids(n.id).length) return; derinlik(n) + 1 >= d ? kapali.add(n.id) : kapali.delete(n.id); });
  kapaliKaydet(); render(); log('Ağaç düzeyi: ' + ({ 1: SOZ().asamalar, 2: SOZ().adimlar, 9: 'Tümü' }[d]), 'gorunum');
}
function agacTus(e) {
  const l = agacGorunenler(); if (!l.length) return false;
  const i = l.findIndex(x => x.n.id === ui.sel), n = i >= 0 ? l[i].n : null;
  const git = id => { ui.agacKaydir = true; sec(id); };
  if (e.key === 'ArrowDown') { e.preventDefault(); git(l[Math.min(l.length - 1, i + 1)].n.id); return true; }
  if (e.key === 'ArrowUp') { e.preventDefault(); git(l[Math.max(0, i - 1)].n.id); return true; }
  if (!n) return false;
  if (e.key === 'ArrowRight') { e.preventDefault(); if (C.kids(n.id).length && kapali.has(n.id)) daralt(n.id, false); else if (C.kids(n.id).length) git(C.kids(n.id)[0].id); return true; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); if (C.kids(n.id).length && !kapali.has(n.id)) daralt(n.id, true); else if (n.parentId) git(n.parentId); return true; }
  if (e.key === 'Enter') { e.preventDefault(); agacAdlandir(n.id); return true; }
  return false;
}
// satırın adını yerinde düzenle
function agacAdlandir(id) {
  const el = document.querySelector(`#agac [data-agad="${id}"]`), n = C.map.get(id); if (!el || !n) return;
  const inp = document.createElement('input'); inp.className = 'ag-input'; inp.value = n.title;
  el.replaceWith(inp); inp.focus(); inp.select();
  let bitti = false;
  const kaydet = ok => { if (bitti) return; bitti = true; const yeni = inp.value.trim();
    if (ok && yeni && yeni !== n.title) { const eski = n.title; degis(() => n.title = yeni, `Yeniden adlandırıldı: "${eski}" → "${yeni}"`); } else render(); };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') kaydet(true); if (ev.key === 'Escape') kaydet(false); });
  inp.addEventListener('blur', () => kaydet(true));
}
// ağaçta tut-sürükle: satırın üst/alt kenarı → önüne/arkasına, ortası → altına
(function () {
  let at = null;
  const temizle = () => { if (!at) return; at.hayalet && at.hayalet.remove(); at.cizgi && at.cizgi.remove();
    document.querySelectorAll('.ag-satir.birak-hedef, .ag-satir.tasinan').forEach(x => x.classList.remove('birak-hedef', 'tasinan')); at = null; };
  const hedef = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest('.ag-satir'); if (!el) return null;
    const id = el.dataset.id; if (at.yasak.has(id)) return null;
    const n = C.map.get(id), r = el.getBoundingClientRect(), o = (y - r.top) / r.height;
    const kardes = C.kids(n.parentId).filter(k => !at.yasak.has(k.id)), i = kardes.findIndex(k => k.id === id);
    if (o > 0.28 && o < 0.72) return { el, parent: id, index: C.kids(id).filter(k => !at.yasak.has(k.id)).length, ic: true };
    return { el, parent: n.parentId, index: o <= 0.28 ? i : i + 1, y: o <= 0.28 ? r.top : r.bottom, x: r.left };
  };
  document.addEventListener('pointerdown', e => {
    if (ui.view !== 'agac' || e.button !== 0) return;
    const el = e.target.closest('#agac .ag-satir'); if (!el || e.target.closest('button, input')) return;
    at = { id: el.dataset.id, el, x0: e.clientX, y0: e.clientY, aktif: false };
  });
  document.addEventListener('pointermove', e => {
    if (!at) return;
    if (!at.aktif) {
      if (Math.hypot(e.clientX - at.x0, e.clientY - at.y0) < 6) return;
      at.aktif = true; at.yasak = new Set([at.id, ...altlar(at.id).map(x => x.id)]);
      at.el.classList.add('tasinan');
      at.hayalet = document.createElement('div'); at.hayalet.id = 'birakEtiket'; document.body.appendChild(at.hayalet);
      at.cizgi = document.createElement('div'); at.cizgi.id = 'birakCizgi'; at.cizgi.className = 'yatay'; document.body.appendChild(at.cizgi);
    }
    const h = hedef(e.clientX, e.clientY); at.h = h;
    document.querySelectorAll('.ag-satir.birak-hedef').forEach(x => x.classList.remove('birak-hedef'));
    at.cizgi.style.display = 'none';
    const ad = C.map.get(at.id).title;
    if (h && h.ic) { h.el.classList.add('birak-hedef'); at.hayalet.textContent = `"${ad}" → "${C.map.get(h.parent).title}" altına`; }
    else if (h) { Object.assign(at.cizgi.style, { display: 'block', left: (h.x + 30) + 'px', top: h.y + 'px', width: (h.el.getBoundingClientRect().width - 30) + 'px' }); at.hayalet.textContent = `"${ad}" buraya`; }
    else at.hayalet.textContent = 'Buraya bırakılamaz';
    at.hayalet.className = h ? '' : 'yok';
    at.hayalet.style.left = (e.clientX + 14) + 'px'; at.hayalet.style.top = (e.clientY + 14) + 'px';
    // kenara yaklaşınca liste kaysın
    const v = vp.getBoundingClientRect();
    if (e.clientY < v.top + 30) vp.scrollTop -= 12; else if (e.clientY > v.bottom - 30) vp.scrollTop += 12;
  });
  document.addEventListener('pointerup', () => {
    if (!at) return; const { aktif, h, id } = at; temizle();
    if (!aktif) return;
    surukleBitti = performance.now();
    if (h) tasi(id, h.parent, h.index);
  });
  document.addEventListener('keydown', e => { if (at && at.aktif && e.key === 'Escape') { temizle(); toast('Taşıma iptal edildi'); } }, true);
})();

/* --- LİSTE: etikete göre gruplu; aynı iş birden çok grupta görünebilir --- */
function listeHTML() {
  const p = P();
  const sira = []; const gez = id => C.kids(id).forEach(k => { sira.push(k); gez(k.id); }); gez(null);
  const gruplar = ui.etiket === '*' ? p.tags : [ui.etiket];
  let h = `<div class="report"><h2>${esc(p.name)} — etiketlere göre işler</h2>
    <div class="meta">Her iş tek kayıttır; birden çok etiketi varsa her grupta görünür. Durumunu bir yerde değiştirmen yeter.</div>`;
  let bos = true;
  gruplar.forEach(t => {
    // etiketi taşıyan en üstteki işler (aşamanın kendisi değil; parsiyel alt işleri kendi satırlarında değil, üst satırda nokta olarak)
    const satir = sira.filter(n => n.parentId && C.etk.get(n.id).has(t) && (!C.map.get(n.parentId).parentId || !C.etk.get(n.parentId).has(t)));
    if (!satir.length) return; bos = false;
    const tamam = satir.filter(n => C.eff.get(n.id) === 'tamam').length;
    h += `<div class="rgroup"><h3><span>${etkHTML(t)}</span><span>${satir.length} iş · ${tamam} tamam</span></h3>`;
    satir.forEach(n => {
      const e = C.eff.get(n.id), kids = C.kids(n.id);
      const bek = [n, ...altlar(n.id)].flatMap(x => C.ob.get(x.id) || []);
      const digerEtk = [...C.etk.get(n.id)].filter(x => x !== t);
      h += `<div class="lrow ${ui.sel === n.id ? 'sel' : ''}" data-id="${n.id}">
        <i class="dot s-${e}" title="${ETKIN[e]}"></i>
        <div class="grow"><div class="what">${escK(n.title)}</div><div class="where">${esc(yol(n.id))}</div>
          ${bek.length ? `<div class="lbek">${bek.map(b => `${esc(b.kimden)}: ${esc(b.text)}`).join(' · ')}</div>` : ''}</div>
        <div class="lsag">${kids.length ? `<div class="ldots">${kids.map(k => `<span title="${esc(k.title)} — ${ETKIN[C.eff.get(k.id)]}"><i class="dot s-${C.eff.get(k.id)}"></i>${esc(k.parsiyel || '')}</span>`).join('')}</div>` : `<div class="small">${ETKIN[e]}</div>`}
          <div class="letk">${digerEtk.map(x => etkHTML(x, 'kucuk')).join('')}</div></div>
      </div>`;
    });
    h += `</div>`;
  });
  if (bos) h += `<div class="empty-note">Bu etikette iş yok. Bir işi seçip soldaki panelden etiket ekleyebilirsin.</div>`;
  return h + `</div>`;
}

/* --- MATRİS --- */
function matrisHTML() {
  const p = P(); const asamalar = C.kids(null);
  const satirlar = [['', 'Genel'], ...p.parsiyels.map(x => [x, GA() === 'Parsiyel' ? x + ' parsiyeli' : x])];
  const agirlik = { bloke: 5, dolayli: 4, devam: 2, onayda: 3, baslamadi: 1, tamam: 0 };
  let h = `<table class="matrix"><tr><th></th>${asamalar.map(a => `<th>${esc(a.title)}</th>`).join('')}</tr>`;
  satirlar.forEach(([ps, ad]) => {
    h += `<tr><th class="row">${esc(ad)}</th>`;
    asamalar.forEach(a => {
      const ns = altlar(a.id).filter(n => n.parsiyel === ps && !(n.perP && !n.parsiyel && C.kids(n.id).length));
      if (!ns.length) { h += `<td class="empty"></td>`; return; }
      const durumlar = ns.map(n => C.eff.get(n.id));
      const enKotu = durumlar.every(s => s === 'tamam') ? 'tamam' : durumlar.reduce((m, s) => agirlik[s] > agirlik[m] ? s : m, 'baslamadi');
      h += `<td class="tint s-${enKotu}"><div class="ds">${ns.map(n => `<i class="dot s-${C.eff.get(n.id)} ${ui.sel === n.id ? 'sel' : ''}" data-id="${n.id}" title="${esc(n.title)} — ${ETKIN[C.eff.get(n.id)]}"></i>`).join('')}</div></td>`;
    });
    h += `</tr>`;
  });
  return h + `</table><p class="small" style="margin:4px 20px">Her nokta bir iş. Hücre rengi o hücredeki en kritik durumu gösterir. Noktaya tıklayınca ayrıntısı soldaki panelde açılır.</p>`;
}

/* --- RAPOR --- */
function raporVerisi() {
  const p = P(); const g = {};
  p.blockers.filter(b => !b.closed && C.map.has(b.nodeId)).forEach(b => { (g[b.kimden] = g[b.kimden] || []).push(b); });
  Object.values(g).forEach(l => l.sort((a, b) => a.at - b.at));
  return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
}
function raporHTML() {
  const p = P(); const gr = raporVerisi();
  const top = gr.reduce((t, [, l]) => t + l.length, 0);
  const z = SOZ();
  let h = `<div class="report"><h2>${esc(p.name)} — ${esc(z.bekleyenler)}</h2><div class="meta">${tarih(now())} · ${top} açık ${esc(kucuk(z.bekleyen))}</div>`;
  if (!gr.length) h += `<div class="empty-note">Açık ${esc(kucuk(z.bekleyen))} yok.</div>`;
  gr.forEach(([kim, l]) => {
    h += `<div class="rgroup"><h3><span>${esc(kim)}</span><span>${l.length}</span></h3>`;
    l.forEach(b => {
      const n = C.map.get(b.nodeId); const et = etkilenen(n.id).length;
      h += `<div class="ritem" data-id="${n.id}"><div><div class="what">${esc(b.text)}</div><div class="where">${esc(yol(n.id))} › ${esc(n.title)}</div></div>
        <div><div class="age">${gunOnce(b.at)}dür</div>${et ? `<div class="aff">${et} iş bekliyor</div>` : ''}</div></div>`;
    });
    h += `</div>`;
  });
  return h + `</div>`;
}
function raporMetni() {
  const p = P(); let t = `${p.name} — ${SOZ().bekleyenler} (${tarih(now())})\n`;
  raporVerisi().forEach(([kim, l]) => {
    t += `\n■ ${kim.toLocaleUpperCase('tr')} (${l.length})\n`;
    l.forEach(b => { const n = C.map.get(b.nodeId); const et = etkilenen(n.id).length;
      t += `  - ${n.title}: ${b.text} (${gunOnce(b.at)}dür${et ? `, ${et} iş bekliyor` : ''})\n`; });
  });
  return t;
}

/* --- YAN PANEL --- */
function renderYan() {
  const side = $('#side'); const p = P();
  if (!ui.sel) {
    const yap = p.nodes.filter(n => !C.kids(n.id).length);
    const say = k => yap.filter(n => C.eff.get(n.id) === k).length;
    const acik = p.blockers.filter(b => !b.closed).length;
    side.innerHTML = `<h2>${esc(p.name)}</h2><div class="path">${esc((sablonBul(p.sablon || 'cephe') || {}).ad || '')}${p.parsiyels.length ? ` · ${p.parsiyels.length} ${esc(GA().toLocaleLowerCase('tr'))}` : ''} · ${yap.length} iş</div>
      <section><div class="sumgrid">
        <div><b>${say('tamam')}</b>${esc(kucuk(SOZ().durum.tamam))}</div><div><b style="color:var(--s-bloke)">${acik}</b>${esc(kucuk(SOZ().bekleyen))}</div>
        <div><b style="color:var(--s-bloke)">${say('bloke')}</b>${esc(kucuk(SOZ().bloke))}</div><div><b style="color:var(--s-dolayli)">${say('dolayli')}</b>${esc(kucuk(SOZ().dolayli))}</div>
      </div></section>
      <section><h4>Nasıl kullanılır</h4><div class="muted" style="line-height:1.55">
        Hattaki bir aşamaya, karta veya ${esc(GA().toLocaleLowerCase('tr'))} çipine tıkla; ayrıntısı burada açılır. Sağ tıkla daha fazla seçenek.<br><br>
        Alttaki <b>komut satırı</b> hem komut hem hızlı not alır:<br>
        <code>git cam</code> → işi bulur ve odaklanır.<br>
        ${(() => { const ilkAdim = p.nodes.find(n => n.perP && C.kids(n.id).length), g = p.parsiyels[0], k = kimdenler()[0] || 'Ekip';
          const kelime = s => esc(katla(String(s).split(/\s+/)[0]));
          if (!p.sablon || p.sablon === 'cephe') return `<code>#cam-B @mimar emaye rengi</code> → B parsiyeli cam siparişine “mimardan bekleniyor” konusu açar.<br><code>#röleve-A !tamam</code> → durumu tamamlandı yapar.<br>`;
          if (ilkAdim && g) return `<code>#${kelime(ilkAdim.title)}-${kelime(g)} @${kelime(k)} …</code> → ${esc(g)} için “${esc(ilkAdim.title)}” işine “${esc(den(k))} bekleniyor” diye ${esc(kucuk(SOZ().bekleyen))} açar.<br><code>#${kelime(ilkAdim.title)}-${kelime(g)} !tamam</code> → durumu “${esc(SOZ().durum.tamam)}” yapar.<br>`;
          return `<code>#iş-adı @${kelime(k)} …</code> → o işe ${esc(kucuk(SOZ().bekleyen))} açar.<br><code>#iş-adı !tamam</code> → durumu tamamlandı yapar.<br>`; })()}
        Düz metin → seçili işe not yazar. Tüm komutlar için <code>?</code> yaz.
      </div></section>
      <section class="small">Giriş yapmadan veriler yalnızca bu tarayıcıda saklanır. Ekiple çalışmak için sağ üstteki ☁ ile giriş yap, sonra proje adının yanındaki “Paylaş” ile davet et.</section>`;
    return;
  }
  const n = C.map.get(ui.sel); const e = C.eff.get(n.id); const kids = C.kids(n.id);
  const bl = p.blockers.filter(b => b.nodeId === n.id).sort((a, b) => a.closed - b.closed || b.at - a.at);
  const notlar = p.notes.filter(x => x.nodeId === n.id).sort((a, b) => b.at - a.at);
  const bekleyenler = p.nodes.filter(x => (x.deps || []).includes(n.id));
  const link = id => { const m = C.map.get(id); return `<span class="dot s-${C.eff.get(id)}" style="margin-top:4px"></span><div class="grow"><a data-go="${id}">${escK(m.title)}</a><div class="small">${esc(yol(id))}</div></div>`; };

  let h = `<textarea class="title-in" id="fTitle" rows="1" spellcheck="false">${esc(n.title)}</textarea>
    <div class="path">${esc(yol(n.id)) || 'Ana aşama'}</div>
    <span class="eff s-${e}"><i class="dot s-${e}"></i>${ETKIN[e]}</span>`;

  h += `<section><h4>Durum</h4>`;
  if (kids.length) h += `<div class="muted small">Alt işlerden hesaplanıyor (${dagilim(n.id).say.tamam || 0}/${dagilim(n.id).y.length} tamam).</div>`;
  else h += `<div class="statusrow">${Object.entries(DURUM).map(([k, v]) => `<button class="s-${k} ${n.status === k ? 'on' : ''}" data-st="${k}"><i class="dot s-${k}"></i>${v}</button>`).join('')}</div>`;
  h += `<div class="row" style="margin-top:8px"><span class="small">${esc(GA())}</span><select id="fPars"><option value="">Genel</option>${p.parsiyels.map(x => `<option ${n.parsiyel === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div></section>`;
  const kendi = n.tags || [], hepsi = C.etk.get(n.id), miras = [...hepsi].filter(t => !kendi.includes(t));
  h += `<section><h4>Etiketler</h4><div class="etks">
    ${kendi.map(t => `<span class="etk" style="--h:${renk(t)}">${esc(t)}<button class="x" data-tdel="${esc(t)}" title="Etiketi kaldır">✕</button></span>`).join('')}
    ${miras.map(t => `<span class="etk miras" style="--h:${renk(t)}" title="Üst aşamadan geliyor; orada kaldırılır">${esc(t)}</span>`).join('')}
    ${!hepsi.size ? '<span class="muted small">Etiket yok.</span>' : ''}</div>
    <div class="etks" style="margin-top:8px">${p.tags.filter(t => !hepsi.has(t)).map(t => `<button class="etk ekle" style="--h:${renk(t)}" data-tadd="${esc(t)}">+ ${esc(t)}</button>`).join('')}
    <input type="text" id="fEtiket" placeholder="Yeni etiket + Enter" style="width:150px;font-size:12px;padding:3px 8px"></div></section>`;

  if (window.tarihPaneli) h += tarihPaneli(n);
  h += `<section><h4>${esc(SOZ().bekleyenler)}</h4><div class="list">`;
  bl.forEach(b => h += `<div class="blk ${b.closed ? 'closed' : ''}"><div class="row"><span class="who grow">${esc(b.kimden)} · ${b.closed ? 'çözüldü' : gunOnce(b.at) + 'dür'}</span>
     <button class="btn sm" data-bclose="${b.id}">${b.closed ? 'Yeniden aç' : 'Çözüldü'}</button><button class="x" data-bdel="${b.id}" title="Sil">✕</button></div>
     <div>${esc(b.text)}</div></div>`);
  if (!bl.length) h += `<div class="muted small">Yok.</div>`;
  h += `</div><div class="form"><div class="row"><select id="fKim">${kimdenler().map(k => `<option>${esc(k)}</option>`).join('')}</select>
     <input type="text" id="fBek" placeholder="${esc(SOZ().soruYer)}" style="flex:1"></div><button class="btn" id="btnBek">+ ${esc(SOZ().bekleyen)} ekle</button></div></section>`;

  h += `<section><h4>Önce bitmesi gerekenler</h4><div class="list">`;
  (n.deps || []).forEach(d => { if (C.map.has(d)) h += `<div class="li">${link(d)}<button class="x" data-ddel="${d}" title="Bağı kaldır">✕</button></div>`; });
  if (!(n.deps || []).length) h += `<div class="muted small">Yok.</div>`;
  h += `</div><div class="form"><select id="fDep"><option value="">+ Bağımlılık ekle…</option>${depSecenek(n)}</select></div></section>`;

  if (bekleyenler.length) {
    h += `<section><h4>Bunu bekleyen işler</h4><div class="list">${bekleyenler.map(x => `<div class="li">${link(x.id)}</div>`).join('')}</div></section>`;
  }

  h += `<section><h4>Notlar</h4><div class="form" style="margin-top:0"><textarea id="fNot" rows="2" placeholder="Not yaz…"></textarea><button class="btn" id="btnNot">+ Not ekle</button></div><div class="list" style="margin-top:8px">`;
  notlar.forEach(x => h += `<div class="note"><div class="row"><span class="small grow">${tarih(x.at)}</span><button class="x" data-ndel="${x.id}">✕</button></div>${esc(x.text).replace(/\n/g, '<br>')}</div>`);
  h += `</div></section>`;

  h += `<section><h4>Alt işler <button class="btn sm" id="btnAlt">+ Ekle</button></h4><div class="list">`;
  kids.forEach(k => h += `<div class="li">${link(k.id)}</div>`);
  if (!kids.length) h += `<div class="muted small">Yok.</div>`;
  h += `</div></section>`;

  const kardes = C.kids(n.parentId), ki = kardes.findIndex(x => x.id === n.id);
  const ilk = ki === 0 ? 'disabled' : '', son = ki === kardes.length - 1 ? 'disabled' : '';
  if (!n.parentId) {
    h += `<section><h4>Aşama düzeni</h4><div class="row" style="flex-wrap:wrap">
      <button class="btn sm" data-act="once" ${ilk}>← Öne al</button><button class="btn sm" data-act="sonra" ${son}>Arkaya al →</button>
      <button class="btn sm" data-act="asamaSol">+ Önüne aşama</button><button class="btn sm" data-act="asamaSag">+ Arkasına aşama</button><button class="btn sm" data-act="kopyala">Kopyala</button></div></section>`;
  } else {
    h += `<section><h4>Sıra ve yer</h4><div class="row" style="flex-wrap:wrap">
      <button class="btn sm" data-act="once" ${ilk}>↑ Yukarı</button><button class="btn sm" data-act="sonra" ${son}>↓ Aşağı</button><button class="btn sm" data-act="kopyala">Kopyala</button>
      <select id="fTasi" style="flex:1"><option value="">Başka yere taşı…</option>${tasiSecenek(n)}</select></div></section>`;
  }
  h += `<section class="row"><button class="btn sm" id="btnKapat">Seçimi kapat</button><span class="grow"></span><button class="btn sm danger" id="btnSil">Bu işi sil</button></section>`;
  side.innerHTML = h;
  const ti = $('#fTitle');
  if (ti) { const boy = () => { ti.style.height = 'auto'; ti.style.height = ti.scrollHeight + 'px'; }; boy(); ti.addEventListener('input', boy); }
}
function tasiSecenek(n) {
  const yasak = new Set([n.id, n.parentId, ...altlar(n.id).map(x => x.id)]);
  return C.kids(null).map(a => [a, ...C.kids(a.id)].filter(x => !yasak.has(x.id))
    .map(x => `<option value="${x.id}">${x.parentId ? '· ' : ''}${esc(x.title)}${x.parentId ? '' : ' (aşama)'}</option>`).join('')).join('');
}
// kardeşler arasında sıra değiştir
function siraDegis(n, yon) {
  const l = C.kids(n.parentId).slice(), i = l.findIndex(x => x.id === n.id), j = i + yon;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; l.forEach((x, k) => x.order = k);
}
function asamaEkleModal(sira) {
  const l = C.kids(null);
  const yer = sira <= 0 ? 'en başa' : sira >= l.length ? 'en sona' : `"${l[sira - 1].title}" ile "${l[sira].title}" arasına`;
  modal(`<h3>Yeni aşama</h3><div class="small">${esc(yer)}</div>
    <label>Aşama adı</label><input type="text" id="mAd" placeholder="ör. Ön Siparişler">
    <p class="small">Ekledikten sonra soldaki panelden altına adım (iş) ekleyebilirsin.</p>
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Ekle</button></div>`, m => {
    const ok = () => {
      const ad = m.querySelector('#mAd').value.trim(); if (!ad) return;
      degis(p => {
        const yeni = node(p, { title: ad, parentId: null });
        const liste = C.kids(null).slice(); liste.splice(sira, 0, yeni);
        liste.forEach((x, k) => x.order = k);
        ui.sel = yeni.id; panelAcik = true;
      }, ad + ' aşaması eklendi');
      modalKapat();
    };
    m.querySelector('#mOk').onclick = ok;
    m.querySelector('#mAd').onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
function depSecenek(n) {
  const yasak = new Set([n.id, ...altlar(n.id).map(x => x.id), ...(n.deps || [])]);
  return C.kids(null).map(a => `<optgroup label="${esc(a.title)}">` +
    [a, ...altlar(a.id)].filter(x => !yasak.has(x.id)).map(x => `<option value="${x.id}">${'· '.repeat(ata(x.id).length)}${esc(x.title)}</option>`).join('') + `</optgroup>`).join('');
}

/* ---------- işlemler ---------- */
// mesaj bir fonksiyonsa değişiklikten sonra hesaplanır (ne yapıldığı ancak o zaman belli olur)
function degis(fn, mesaj) { fn(P()); etiketTamamla(P()); if (window.durumIzle) durumIzle(P()); if (typeof mesaj === 'function') mesaj = mesaj(); sonMesaj = mesaj || (ui.sel && C.map.get(ui.sel) ? '"' + C.map.get(ui.sel).title + '" düzenlendi' : 'Değişiklik'); save(); render(); if (mesaj) toast(mesaj); }
function sec(id) { ui.sel = id; if (id) panelAcik = true; render(); }

function dugumSil(id) {
  degis(p => {
    const sil = new Set([id, ...altlar(id).map(x => x.id)]);
    p.nodes = p.nodes.filter(x => !sil.has(x.id));
    p.nodes.forEach(x => x.deps = (x.deps || []).filter(d => !sil.has(d)));
    p.blockers = p.blockers.filter(b => !sil.has(b.nodeId));
    p.notes = p.notes.filter(b => !sil.has(b.nodeId));
    ui.sel = null;
  }, 'Silindi');
}

/* ---------- hızlı not ---------- */
function hizliNot(txt) {
  txt = txt.trim(); if (!txt) return;
  const etiketler = [...txt.matchAll(/#(\S+)/g)].map(m => m[1]);
  const kimM = txt.match(/@(\S+)/);
  const durM = txt.match(/!(\S+)/);
  const metin = txt.replace(/[#@!]\S+/g, '').replace(/\s+/g, ' ').trim();

  const uygula = id => {
    const n = C.map.get(id); const mesaj = [];
    degis(p => {
      if (durM) {
        const d = norm(durM[1]);
        const st = d.startsWith('tam') || d.startsWith('bit') ? 'tamam' : d.startsWith('dev') ? 'devam' : d.startsWith('ona') ? 'onayda' : d.startsWith('baş') || d.startsWith('bas') ? 'baslamadi' : null;
        if (d.startsWith('çöz') || d.startsWith('coz')) { p.blockers.filter(b => b.nodeId === id && !b.closed).forEach(b => { b.closed = true; b.closedAt = now(); }); mesaj.push('bekleyenler çözüldü'); }
        else if (st && !C.kids(id).length) { n.status = st; mesaj.push('durum: ' + DURUM[st]); }
      }
      if (kimM) {
        const k = norm(kimM[1]); const kim = kimdenler().find(x => norm(x).startsWith(k)) || (kimM[1][0].toLocaleUpperCase('tr') + kimM[1].slice(1));
        p.blockers.push({ id: uid(), nodeId: id, kimden: kim, text: metin || 'Bilgi bekleniyor', at: now(), closed: false });
        mesaj.push(den(kim) + ' bekleniyor' + (metin ? ': ' + metin : ''));
      } else if (metin) { p.notes.push({ id: uid(), nodeId: id, text: metin, at: now() }); mesaj.push('not eklendi'); }
      ui.sel = id;
    }, () => n.title + ': ' + (mesaj.join(', ') || 'seçildi'));
    $('#quickIn').value = '';
  };

  if (!etiketler.length) {
    if (!ui.sel) { toast('Önce bir iş seç ya da #etiket yaz (ör. #cam-B)'); return; }
    return uygula(ui.sel);
  }
  const p = P();
  const parca = etiketler.flatMap(t => t.split(/[-_.]/)).map(norm).filter(Boolean);
  let aday = p.nodes.filter(n => parca.every(pc => norm(n.parsiyel) === pc || norm(n.title).includes(pc)));
  // parsiyel belirtilmişse parsiyelli olanı öne al
  const parsVar = parca.some(pc => p.parsiyels.some(x => norm(x) === pc));
  if (parsVar) { const kesin = aday.filter(n => n.parsiyel && parca.includes(norm(n.parsiyel))); if (kesin.length) aday = kesin; }
  aday.sort((a, b) => a.title.length - b.title.length);
  if (!aday.length) { toast('Eşleşen iş bulunamadı: #' + etiketler.join(' #')); return; }
  if (aday.length === 1) return uygula(aday[0].id);
  modal(`<h3>Hangi iş?</h3><div class="pick">${aday.slice(0, 12).map(n => `<button data-pick="${n.id}"><b>${esc(n.title)}</b><div class="small">${esc(yol(n.id))}</div></button>`).join('')}</div>
    <div class="acts"><button class="btn" data-close>Vazgeç</button></div>`, m => {
    m.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { modalKapat(); uygula(b.dataset.pick); });
  });
}

/* ---------- modal / toast ---------- */
function modal(html, bagla) {
  $('#modal').innerHTML = html; $('#modalBg').hidden = false;
  $('#modal').querySelectorAll('[data-close]').forEach(b => b.onclick = modalKapat);
  bagla && bagla($('#modal'));
  const ilk = $('#modal').querySelector('input'); ilk && ilk.focus();
}
function modalKapat() { $('#modalBg').hidden = true; $('#modal').innerHTML = ''; $('#modal').classList.remove('genis'); }
let toastT;
function toast(t) { log(t, 'bilgi'); const el = $('#toast'), ks = $('#konsol'); if (ks && getComputedStyle(ks).display !== 'none') el.style.bottom = (ks.offsetHeight + 14) + 'px'; el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }

function yeniProjeModal(secili = 'cephe') {
  const hepsi = [...SABLONLAR, ...S.sablonlar];
  const sb = hepsi.find(s => s.id === secili) || SABLONLAR[0];
  const asamaSay = s => s.ozel ? s.nodes.filter(n => !n.parentId).length : s.asamalar.length;
  modal(`<h3>Yeni proje</h3>
    <label>Şablon</label>
    <div class="sablonlar">${hepsi.map(s => `<button class="sablon ${s.id === sb.id ? 'on' : ''}" data-sablon="${s.id}">
      <span class="sb-ikon">${esc(s.ikon || '•')}</span><span class="sb-yazi"><b>${esc(s.ad)}</b><small>${esc(s.aciklama || '')}</small>
      <small class="sb-alt">${asamaSay(s)} aşama · ${esc(cogul(s.grupAdi))}: ${s.gruplar.length ? esc(s.gruplar.join(', ')) : '—'}</small></span>
      ${s.ozel ? `<span class="sb-sil" data-sbsil="${s.id}" title="Şablonu sil">✕</span>` : ''}</button>`).join('')}</div>
    <label>Proje adı</label><input type="text" id="mAd" placeholder="ör. ${sb.id === 'ders' ? 'LGS hazırlık' : sb.id === 'cephe' ? 'Levent Ofis Kulesi' : 'Yeni proje'}">
    <label>${esc(cogul(sb.grupAdi))} (virgülle; boş bırakabilirsin)</label><input type="text" id="mPars" value="${esc(sb.gruplar.join(', '))}">
    ${sb.ornek ? `<label class="onay-kutu"><input type="checkbox" id="mOrnek"> Örnek verilerle başlat <span class="small">— nasıl kullanıldığını görmek için birkaç durum, ${esc(kucuk((sb.soz && sb.soz.bekleyen) || 'bekleyen konu'))} ve not eklenir</span></label>` : ''}
    <p class="small">Aşamalar ve bağımlılıklar şablondan kurulur; sonra her şeyi değiştirebilirsin. Kendi projeni de Ayarlar → “Şablon olarak kaydet” ile buraya ekleyebilirsin.</p>
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Oluştur</button></div>`, m => {
    $('#modal').classList.add('genis');
    m.querySelectorAll('[data-sablon]').forEach(b => b.onclick = e => {
      const sl = e.target.closest('[data-sbsil]');
      if (sl) { const s = S.sablonlar.find(x => x.id === sl.dataset.sbsil); if (s && confirm(`"${s.ad}" şablonu silinsin mi?`)) { S.sablonlar = S.sablonlar.filter(x => x !== s); save(); toast('Şablon silindi'); yeniProjeModal(); } return; }
      const ad = m.querySelector('#mAd').value; yeniProjeModal(b.dataset.sablon); if (ad) $('#mAd').value = ad;
    });
    const ok = () => {
      const ad = m.querySelector('#mAd').value.trim() || sb.ad;
      const ps = m.querySelector('#mPars').value.split(',').map(s => s.trim()).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i);
      const p = yeniProje(ad, ps, sb.id); if (m.querySelector('#mOrnek') && m.querySelector('#mOrnek').checked) ornekVeriEkle(p, sb); S.projects.push(p); S.activeId = p.id; ui.sel = null; ui.parsiyel = '*'; ui.etiket = '*';
      sonMesaj = `Yeni proje: ${ad} (${sb.ad})`; save(); modalKapat(); render(); toast(`Proje oluşturuldu: ${ad}`); konsolCiz();
      if (ui.view === 'hat' || ui.view === 'zihin') requestAnimationFrame(sigdir);
    };
    m.querySelector('#mOk').onclick = ok;
    m.querySelector('#mAd').onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
function ayarModal() {
  const p = P();
  modal(`<h3>Proje ayarları</h3>
    <label>Proje adı</label><input type="text" id="mAd" value="${esc(p.name)}">
    <div class="row" style="gap:10px;margin-top:10px"><label style="margin:0">Grup adı</label><input type="text" id="mGa" value="${esc(GA())}" style="width:140px">
      <span class="small">Parsiyel, Ders, Modül, Bölüm…</span></div>
    <label>${esc(cogul(GA()))} <span class="small">— adına tıklayıp değiştirebilirsin</span></label>
    <div class="gruplar">${p.parsiyels.map(g => `<span class="grup"><input type="text" value="${esc(g)}" data-geski="${esc(g)}"><button class="x" data-gsil="${esc(g)}" title="Sil">✕</button></span>`).join('') || '<span class="small">Henüz yok.</span>'}</div>
    <div class="row" style="margin-top:6px"><input type="text" id="mPar" placeholder="Yeni ${esc(GA().toLocaleLowerCase('tr'))} adı" style="flex:1"><button class="btn" id="mParOk">Ekle</button></div>
    <p class="small">Yeni ${esc(GA().toLocaleLowerCase('tr'))}, gruplu adımların hepsine bağımlılıklarıyla eklenir.</p>
    <label>Kimden bekleniyor? <span class="small">(virgülle)</span></label><input type="text" id="mKimler" value="${esc(kimdenler().join(', '))}">
    <label>Etiketler</label><div class="etks">${p.tags.map(t => `<span class="etk" style="--h:${renk(t)}">${esc(t)} <span class="small">(${p.nodes.filter(n => (n.tags || []).includes(t)).length})</span><button class="x" data-ptdel="${esc(t)}" title="Etiketi projeden sil">✕</button></span>`).join('') || '—'}</div>
    <div class="row" style="margin-top:6px"><input type="text" id="mEtk" placeholder="Yeni etiket (ör. Asaş, Cam)" style="flex:1"><button class="btn" id="mEtkOk">Ekle</button></div>
    <label>Şablon</label><div class="row"><input type="text" id="mSb" placeholder="Şablon adı" value="${esc(p.name)} şablonu" style="flex:1"><button class="btn" id="mSbOk">Şablon olarak kaydet</button></div>
    <p class="small">Aşamalar, adımlar, ${esc(cogul(GA()).toLocaleLowerCase('tr'))}, bağımlılıklar ve etiketler saklanır; durumlar sıfırlanır, bekleyen konular ve notlar alınmaz.</p>
    <div class="acts"><button class="btn danger" id="mSil" style="margin-right:auto">Projeyi sil</button><button class="btn" data-close>Kapat</button><button class="btn primary" id="mOk">Kaydet</button></div>`, m => {
    $('#modal').classList.add('genis');
    m.querySelector('#mOk').onclick = () => {
      const ad = m.querySelector('#mAd').value.trim(), ga = m.querySelector('#mGa').value.trim();
      const kimler = m.querySelector('#mKimler').value.split(',').map(s => s.trim()).filter(Boolean);
      const adlar = [...m.querySelectorAll('[data-geski]')].map(i => [i.dataset.geski, i.value.trim()]).filter(([a, b]) => b && a !== b);
      degis(p => {
        if (ad) p.name = ad; if (ga) p.grupAdi = ga; if (kimler.length) p.kimden = kimler;
        adlar.forEach(([a, b]) => parsiyelAdlandir(p, a, b));
        if (ui.parsiyel !== '*' && !p.parsiyels.includes(ui.parsiyel)) ui.parsiyel = '*';
      }, 'Proje ayarları kaydedildi'); modalKapat();
    };
    m.querySelectorAll('[data-gsil]').forEach(b => b.onclick = () => {
      const g = b.dataset.gsil, say = parsiyelSilinecek(p, g).size;
      if (!confirm(`"${g}" silinsin mi?` + (say ? ` Ona ait ${say} iş de silinecek.` : ''))) return;
      degis(p => { parsiyelSil(p, g); if (ui.parsiyel === g) ui.parsiyel = '*'; }, `${GA()} silindi: ${g}`); modalKapat(); ayarModal();
    });
    m.querySelector('#mSbOk').onclick = () => {
      const ad = m.querySelector('#mSb').value.trim(); if (!ad) return;
      sablonaKaydet(p, ad); save(); toast(`Şablon kaydedildi: ${ad} — “+ Proje” penceresinde görünür`);
    };
    m.querySelector('#mEtkOk').onclick = () => { const ad = m.querySelector('#mEtk').value.trim(); if (!ad) return; degis(p => { if (!p.tags.includes(ad)) p.tags.push(ad); }, ad + ' etiketi eklendi'); modalKapat(); ayarModal(); };
    m.querySelectorAll('[data-ptdel]').forEach(b => b.onclick = () => {
      const t = b.dataset.ptdel, say = p.nodes.filter(n => (n.tags || []).includes(t)).length;
      if (!confirm(`"${t}" etiketi silinsin mi?` + (say ? ` ${say} işten kaldırılacak (işler silinmez).` : ''))) return;
      degis(p => { p.tags = p.tags.filter(x => x !== t); p.nodes.forEach(n => n.tags = (n.tags || []).filter(x => x !== t)); }, 'Etiket silindi'); modalKapat(); ayarModal();
    });
    m.querySelector('#mParOk').onclick = () => { const ad = m.querySelector('#mPar').value.trim(); if (!ad) return; if (p.parsiyels.includes(ad)) { toast('Bu ad zaten var'); return; } degis(p => parsiyelEkle(p, ad), `${GA()} eklendi: ${ad}`); modalKapat(); ayarModal(); };
    m.querySelector('#mPar').onkeydown = e => { if (e.key === 'Enter') m.querySelector('#mParOk').click(); };
    m.querySelector('#mSil').onclick = () => {
      if (!confirm(`"${p.name}" projesi tamamen silinsin mi? Bu geri alınamaz.`)) return;
      S.projects = S.projects.filter(x => x.id !== p.id);
      if (!S.projects.length) S.projects.push(yeniProje('Yeni proje', ['A']));
      S.activeId = S.projects[0].id; ui.sel = null; sonMesaj = 'Proje silindi: ' + p.name; save(); modalKapat(); render();
    };
  });
}
function altIsModal(parentId, onceId = '') {
  const p = P(); const par = C.map.get(parentId);
  const kardes = C.kids(parentId), oi = onceId ? kardes.findIndex(x => x.id === onceId) : -1;
  const yer = oi === 0 ? 'en üste' : oi > 0 ? `"${kardes[oi - 1].title}" ile "${kardes[oi].title}" arasına` : 'en alta';
  modal(`<h3>Adım ekle</h3><div class="small">${esc(par.title)} · ${esc(yer)}</div>
    <label>İş adı</label><input type="text" id="mAd" placeholder="ör. Kepenk profili siparişi">
    <label>${esc(GA())}</label><select id="mPars"><option value="">Genel</option>${p.parsiyels.map(x => `<option ${par.parsiyel === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
    ${p.parsiyels.length && !par.parsiyel ? `<label style="display:flex;gap:8px;align-items:center;color:var(--ink);font-size:13px;margin-top:12px"><input type="checkbox" id="mBol"> Her ${esc(GA().toLocaleLowerCase('tr'))} için ayrı alt iş aç (${p.parsiyels.map(esc).join(', ')})</label>` : ''}
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Ekle</button></div>`, m => {
    const ok = () => {
      const ad = m.querySelector('#mAd').value.trim(); if (!ad) return;
      const bol = m.querySelector('#mBol')?.checked;
      degis(p => {
        const n = node(p, { title: ad, parentId, parsiyel: bol ? '' : m.querySelector('#mPars').value, perP: !!bol });
        const liste = C.kids(parentId).slice(); liste.splice(oi >= 0 ? oi : liste.length, 0, n);
        liste.forEach((x, k) => x.order = k);
        if (bol) p.parsiyels.forEach((ps, k) => node(p, { title: ad + ' – ' + ps, parentId: n.id, order: k, parsiyel: ps }));
        ui.sel = n.id;
      }, 'Eklendi');
      modalKapat();
    };
    m.querySelector('#mOk').onclick = ok;
    m.querySelector('#mAd').onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}

/* ---------- olaylar ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  if (performance.now() - surukleBitti < 200 && t.closest('#viewport')) return; // sürükleme sonrası tıklamayı yut
  if (t.id === 'btnFit') { sigdir(); return; }
  if (t.id === 'btnKureOrtala') { window.kureOrtala && window.kureOrtala(); return; }
  if (t.id === 'btnKureDon') { ui.kureDon = !ui.kureDon; renderToolbar(); return; }
  if (t.closest('#btnSide')) { paneliAyarla(!panelAcik); return; }
  if (!t.closest('#ctx')) ctxKapat();
  const ci = t.closest('[data-ci]');
  if (ci) { if (!ci.disabled && !ci.classList.contains('acilir')) { const f = ctxEylem[+ci.dataset.ci]; ctxKapat(); f && f(); } return; }
  if (t.closest('#ctx')) return;
  const dr = t.closest('[data-dar]');
  if (dr && $('#viewport').contains(dr)) { daralt(dr.dataset.dar); return; }
  if (t.id === 'btnPanoTemizle') { pano = null; render(); return; }
  const ins = t.closest('[data-ins]');
  if (ins) { pano ? yapistir(null, +ins.dataset.ins) : asamaEkleModal(+ins.dataset.ins); return; }
  const ia = t.closest('[data-adim]');
  if (ia) {
    if (pano) { const l = C.kids(ia.dataset.adim), i = ia.dataset.once ? l.findIndex(x => x.id === ia.dataset.once) : l.length; yapistir(ia.dataset.adim, i); }
    else altIsModal(ia.dataset.adim, ia.dataset.once);
    return;
  }
  const act = t.closest('[data-act]');
  if (act && ui.sel) {
    const n0 = C.map.get(ui.sel), a = act.dataset.act;
    if (a === 'once' || a === 'sonra') degis(() => siraDegis(n0, a === 'once' ? -1 : 1));
    else if (a === 'kopyala') kopyala(n0.id);
    else { const i = C.kids(null).findIndex(x => x.id === n0.id); asamaEkleModal(a === 'asamaSol' ? i : i + 1); }
    return;
  }
  // seçim (hat / matris / rapor)
  const d = t.closest('[data-id]');
  if (d && $('#viewport').contains(d)) {
    // ağaçta aynı satıra hızlı ikinci tık → yerinde yeniden adlandır
    const simdi = performance.now(), ayni = sonTik.id === d.dataset.id && simdi - sonTik.t < 450;
    sonTik = { id: d.dataset.id, t: simdi };
    if (ui.view === 'agac' && ayni && t.closest('[data-agad]')) { agacAdlandir(d.dataset.id); return; }
    if (ui.sel !== d.dataset.id || !panelAcik) sec(d.dataset.id);
    return;
  }
  const go = t.closest('[data-go]'); if (go) { sec(go.dataset.go); return; }
  // segment düğmeleri
  const sb = t.closest('.seg[data-seg] button');
  if (sb) { const k = sb.parentElement.dataset.seg; if (k === 'zoom') { yakinlas(ONAYAR[+sb.dataset.val]); return; } ui[k] = sb.dataset.val; render(); return; }
  const v = t.closest('#views button'); if (v) { ui.view = v.dataset.v; log('Görünüm: ' + v.textContent.trim(), 'gorunum'); render(); return; }
  if (t.closest('#viewport') && !d && haritaMi() && ui.sel) { ui.sel = null; render(); return; }

  // yan panel
  const n = ui.sel && C.map.get(ui.sel);
  if (t.closest('[data-st]') && n) { const st = t.closest('[data-st]').dataset.st; if (n.status !== st) degis(() => n.status = st, `"${n.title}": ${DURUM[st]}`); }
  if (t.dataset.bclose) degis(p => { const b = p.blockers.find(x => x.id === t.dataset.bclose); b.closed = !b.closed; b.closedAt = now(); }, 'Güncellendi');
  if (t.dataset.bdel && confirm(`Bu ${kucuk(SOZ().bekleyen)} silinsin mi?`)) degis(p => p.blockers = p.blockers.filter(x => x.id !== t.dataset.bdel));
  if (t.dataset.ndel && confirm('Not silinsin mi?')) degis(p => p.notes = p.notes.filter(x => x.id !== t.dataset.ndel));
  if (t.dataset.ddel && n) degis(() => n.deps = n.deps.filter(x => x !== t.dataset.ddel), 'Bağ kaldırıldı');
  const ta = t.closest('[data-tadd]'); if (ta && n) degis(() => n.tags = [...(n.tags || []), ta.dataset.tadd], ta.dataset.tadd + ' etiketi eklendi');
  const td = t.closest('[data-tdel]'); if (td && n) degis(() => n.tags = (n.tags || []).filter(x => x !== td.dataset.tdel), 'Etiket kaldırıldı');
  if (t.id === 'btnBek' && n) {
    const txt = $('#fBek').value.trim(); if (!txt) { $('#fBek').focus(); return; }
    degis(p => p.blockers.push({ id: uid(), nodeId: n.id, kimden: $('#fKim').value, text: txt, at: now(), closed: false }), `${SOZ().bekleyen} eklendi: ${txt}`);
  }
  if (t.id === 'btnNot' && n) { const txt = $('#fNot').value.trim(); if (txt) degis(p => p.notes.push({ id: uid(), nodeId: n.id, text: txt, at: now() }), 'Not eklendi'); }
  if (t.id === 'btnAlt' && n) altIsModal(n.id);
  if (t.id === 'btnKapat') sec(null);
  if (t.id === 'btnSil' && n && confirm(`"${n.title}" ve altındaki her şey silinsin mi?`)) dugumSil(n.id);

  // üst bar
  if (t.closest('#btnTema')) { temaDegis(); return; }
  if (t.id === 'btnYon') { yonAyarla(!ui.dikey); return; }
  if (t.id === 'btnHepsiDar') { hepsiniDaralt(true); return; }
  if (t.id === 'btnHepsiAc') { hepsiniDaralt(false); return; }
  const dz = t.closest('[data-duzey]'); if (dz) { agacDuzey(+dz.dataset.duzey); return; }
  if (t.id === 'btnKonsol') { konsolAcKapa(); return; }
  if (t.id === 'btnKonsolTemizle') { kayit = []; kayitKaydet(); konsolCiz(); return; }
  const kg = t.closest('[data-kgo]'); if (kg) { if (C.map.has(kg.dataset.kgo)) { sec(kg.dataset.kgo); odaklan(kg.dataset.kgo); } else toast('Bu iş artık yok'); return; }
  const kk = t.closest('[data-kkomut]'); if (kk) { if (kk.dataset.kkomut === '?') komut('?'); else { $('#quickIn').value = kk.dataset.kkomut + ' '; $('#quickIn').focus(); } return; }
  if (t.closest('#btnGeri')) { geriAl(); return; }
  if (t.closest('#btnIleri')) { yinele(); return; }
  if (t.id === 'btnNewProj') yeniProjeModal();
  if (t.id === 'btnProjSet') ayarModal();
  if (t.id === 'quickGo') hizliNot($('#quickIn').value);
  if (t.id === 'btnCopy') navigator.clipboard.writeText(raporMetni()).then(() => toast('Rapor metni kopyalandı'), () => toast('Kopyalanamadı'));
  if (t.id === 'btnPrint') window.print();
  if (t.id === 'btnExport') disaAktar();
});
document.addEventListener('change', e => {
  const t = e.target; const n = ui.sel && C.map.get(ui.sel);
  if (t.id === 'projSel') { S.activeId = t.value; ui.sel = null; ui.parsiyel = '*'; save(); render(); log('Proje: ' + P().name, 'gorunum'); konsolCiz(); }
  if (t.id === 'fTitle' && n && t.value.trim() && t.value.trim() !== n.title) { const eski = n.title, yeni = t.value.trim(); degis(() => n.title = yeni, `Yeniden adlandırıldı: "${eski}" → "${yeni}"`); }
  if (t.id === 'fPars' && n) degis(() => n.parsiyel = t.value, `"${n.title}" ${GA().toLocaleLowerCase('tr')}: ${t.value || 'Genel'}`);
  if (t.id === 'fTasi' && n && t.value) degis(() => { const eski = n.parentId; n.parentId = t.value; n.order = C.kids(t.value).length; C.kids(eski).filter(x => x.id !== n.id).forEach((x, k) => x.order = k); }, 'Taşındı');
  if (t.id === 'fDep' && n && t.value) degis(() => n.deps = [...(n.deps || []), t.value], 'Bağımlılık eklendi');
  if (t.id === 'fileImport' && t.files[0]) iceAktar(t.files[0]);
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'quickIn') {
    if (e.key === 'Enter') { const v = e.target.value; komutGecmisi.push(v); komutSira = komutGecmisi.length; komut(v); return; }
    if (e.key === 'ArrowUp' && komutGecmisi.length) { e.preventDefault(); komutSira = Math.max(0, komutSira - 1); e.target.value = komutGecmisi[komutSira] || ''; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); komutSira = Math.min(komutGecmisi.length, komutSira + 1); e.target.value = komutGecmisi[komutSira] || ''; return; }
    if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); return; }
  }
  if (e.target.id === 'fBek' && e.key === 'Enter') $('#btnBek').click();
  if (e.target.id === 'fTitle' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  if (e.target.id === 'fEtiket' && e.key === 'Enter') {
    const ad = e.target.value.trim(), n = ui.sel && C.map.get(ui.sel); if (!ad || !n) return;
    degis(p => { if (!p.tags.includes(ad)) p.tags.push(ad); if (!(n.tags || []).includes(ad)) n.tags = [...(n.tags || []), ad]; }, ad + ' etiketi eklendi');
    setTimeout(() => $('#fEtiket') && $('#fEtiket').focus(), 0);
  }
  if (e.key === 'Escape' && tas && tas.aktif) { tasIptal(); return; }
  // Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z — yazı alanlarında tarayıcının kendi geri alması çalışsın
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && $('#modalBg').hidden && !(tas && tas.aktif)) {
    const k = e.key.toLocaleLowerCase('en');
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); geriAl(); return; }
    if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); yinele(); return; }
  }
  if (e.key === 'Escape') { if (!$('#modalBg').hidden) modalKapat(); else if ($('#ctx')) ctxKapat(); else if (pano) { pano = null; render(); } }
  // Ctrl+C / Ctrl+V (yazı alanlarında değilken)
  const yazi = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !$('#modalBg').hidden;
  if (!yazi && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    const k = e.key.toLocaleLowerCase('tr');
    if (k === 'c' && ui.sel) { e.preventDefault(); kopyala(ui.sel); }
    if (k === 'd' && ui.sel) { e.preventDefault(); cogalt(ui.sel); }
    if (k === 'v' && pano) { e.preventDefault(); ui.sel ? sonrasinaYapistir(ui.sel) : yapistir(null, C.kids(null).length); }
  }
  if (!yazi && !e.ctrlKey && !e.metaKey && !e.altKey && ui.view === 'agac' && agacTus(e)) return;
  if (!yazi && !e.ctrlKey && !e.metaKey && !e.altKey && ui.sel && C.map.has(ui.sel)) {
    if (e.key === 'Delete') { e.preventDefault(); silSor(ui.sel); }
    if (e.key === 'F2') { e.preventDefault(); yenidenAdlandir(ui.sel); }
  }
});

/* ---------- kopyala / yapıştır ---------- */
let pano = null; // { kokId, baslik, nodes: [kök + tüm altları] }
let sonTik = { id: null, t: 0 };
function kopyala(id) {
  const kok = C.map.get(id); if (!kok) return;
  const liste = [kok, ...altlar(id)];
  pano = { kokId: id, baslik: kok.title, nodes: JSON.parse(JSON.stringify(liste)) };
  render(); toast(`Kopyalandı: ${kok.title} (${liste.length} iş) — yapıştırmak için bir + işaretine tıkla`);
}
function yapistir(parentId, sira) {
  if (!pano) return;
  degis(p => {
    const yeniId = new Map(pano.nodes.map(n => [n.id, uid()]));
    const mevcut = new Set(p.nodes.map(n => n.id));
    let kok;
    pano.nodes.forEach(n => {
      const k = { ...n, id: yeniId.get(n.id), status: 'baslamadi',
        parentId: n.id === pano.kokId ? parentId : yeniId.get(n.parentId),
        // kopyanın içindeki bağlar kopyaya, dışarıdakiler aynen (bu projede varsa)
        deps: (n.deps || []).map(d => yeniId.get(d) || (mevcut.has(d) ? d : null)).filter(Boolean) };
      if (n.id === pano.kokId) { k.title = n.title + ' (kopya)'; kok = k; }
      p.nodes.push(k);
    });
    const liste = p.nodes.filter(x => x.parentId === parentId && x.id !== kok.id).sort((a, b) => a.order - b.order);
    liste.splice(Math.max(0, Math.min(sira, liste.length)), 0, kok);
    liste.forEach((x, k) => x.order = k);
    ui.sel = kok.id; panelAcik = true;
  }, 'Yapıştırıldı — adını soldaki panelden değiştirebilirsin');
}
function sonrasinaYapistir(id) {
  const n = C.map.get(id); if (!n) return;
  const l = C.kids(n.parentId); yapistir(n.parentId, l.findIndex(x => x.id === id) + 1);
}

/* ---------- sağ tık menüsü ---------- */
function ctxKapat() { const m = $('#ctx'); if (m) m.remove(); }
let ctxEylem = [];
// öğe: { t: metin, k: kısayol, a: eylem, alt: [alt menü], dis: pasif, cls: ek sınıf, ok: işaretli } · '-' = ayraç
function ctxAc(x, y, baslik, ogeler) {
  ctxKapat(); ctxEylem = [];
  const ciz = liste => liste.filter(Boolean).map(o => {
    if (o === '-') return '<div class="ctx-ayrac"></div>';
    const i = ctxEylem.push(o.a || null) - 1;
    const isaret = o.ok === true ? '<i class="ctx-ok">✓</i>' : o.ok === 'miras' ? '<i class="ctx-ok miras">✓</i>' : o.ok === false ? '<i class="ctx-ok"></i>' : '';
    if (o.alt) return `<div class="ctx-grup"><button data-ci="${i}" class="acilir ${o.cls || ''}" ${o.dis ? 'disabled' : ''}>${isaret}<b>${o.t}</b><span>▸</span></button><div class="ctx ctx-alt">${ciz(o.alt)}</div></div>`;
    return `<button data-ci="${i}" class="${o.cls || ''}" ${o.dis ? 'disabled' : ''}>${isaret}<b>${o.t}</b>${o.k ? `<span>${o.k}</span>` : ''}</button>`;
  }).join('');
  const m = document.createElement('div'); m.id = 'ctx'; m.className = 'ctx';
  m.innerHTML = (baslik ? `<div class="ctx-t">${esc(baslik)}</div>` : '') + ciz(ogeler);
  document.body.appendChild(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  if (x + r.width + 230 > innerWidth) m.classList.add('sola');   // alt menüler sola açılsın
  // alt menü ekranın altından taşmasın
  m.querySelectorAll('.ctx-grup').forEach(g => g.addEventListener('mouseenter', () => {
    const a = g.querySelector('.ctx-alt'); a.style.top = ''; const ar = a.getBoundingClientRect();
    if (ar.bottom > innerHeight - 8) a.style.top = (innerHeight - 8 - ar.bottom - 4) + 'px';
  }));
}

/* --- daraltma: kişisel görünüm tercihi, tarayıcıda saklanır --- */
let kapali = new Set((() => { try { return JSON.parse(localStorage.getItem('projeHatti.kapali') || '[]'); } catch (e) { return []; } })());
function kapaliKaydet() { try { localStorage.setItem('projeHatti.kapali', JSON.stringify([...kapali])); } catch (e) {} }
function daralt(id, durum) {
  const kapat = durum === undefined ? !kapali.has(id) : durum;
  kapat ? kapali.add(id) : kapali.delete(id); kapaliKaydet(); render();
  log((kapat ? 'Daraltıldı: ' : 'Genişletildi: ') + (C.map.get(id) || {}).title, 'gorunum', id);
}
function hepsiniDaralt(kapat, haric) {
  C.kids(null).forEach(a => { if (a.id === haric) kapali.delete(a.id); else kapat ? kapali.add(a.id) : kapali.delete(a.id); });
  if (!kapat) P().nodes.forEach(n => kapali.delete(n.id));
  kapaliKaydet(); render();
  log(kapat ? (haric ? 'Diğer aşamalar daraltıldı' : 'Tümü daraltıldı') : 'Tümü genişletildi', 'gorunum');
}

/* --- menüdeki işlemler --- */
function silSor(id) {
  const n = C.map.get(id), say = altlar(id).length;
  if (confirm(`"${n.title}"${say ? ` ve altındaki ${say} iş` : ''} silinsin mi?`)) dugumSil(id);
}
function cogalt(id) {
  const n = C.map.get(id), eskiPano = pano;
  pano = { kokId: id, baslik: n.title, nodes: JSON.parse(JSON.stringify([n, ...altlar(id)])) };
  sonrasinaYapistir(id); pano = eskiPano; render();
}
function yenidenAdlandir(id) {
  ui.sel = id; panelAcik = true; render();
  const ti = $('#fTitle'); if (ti) { ti.focus(); ti.select(); }
}
function topluDurum(id, st) {
  const yap = yapraklar(id).filter(x => x.id !== id || !C.kids(id).length);
  degis(() => yap.forEach(x => x.status = st), `${yap.length} iş: ${DURUM[st]}`);
}
function bekleyenModal(id) {
  const n = C.map.get(id);
  modal(`<h3>${esc(SOZ().bekleyen)}</h3><div class="small">${esc(n.title)}</div>
    <label>Kimden bekleniyor?</label><select id="mKim">${kimdenler().map(k => `<option>${esc(k)}</option>`).join('')}</select>
    <label>${esc(SOZ().soruYer)}</label><input type="text" id="mBek" placeholder="ör. Emaye RAL kodu">
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Ekle</button></div>`, m => {
    const ok = () => { const txt = m.querySelector('#mBek').value.trim(); if (!txt) return;
      const kim = m.querySelector('#mKim').value; modalKapat();
      degis(p => { p.blockers.push({ id: uid(), nodeId: id, kimden: kim, text: txt, at: now(), closed: false }); ui.sel = id; }, `${den(kim)} bekleniyor: ${txt}`); };
    m.querySelector('#mOk').onclick = ok;
    m.querySelector('#mBek').onkeydown = e => { if (e.key === 'Enter') ok(); };
    setTimeout(() => m.querySelector('#mBek').focus(), 0);
  });
}
function notModal(id) {
  const n = C.map.get(id);
  modal(`<h3>Not ekle</h3><div class="small">${esc(n.title)}</div>
    <label>Not</label><textarea id="mNot" rows="4" style="width:100%"></textarea>
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Ekle</button></div>`, m => {
    m.querySelector('#mOk').onclick = () => { const txt = m.querySelector('#mNot').value.trim(); if (!txt) return; modalKapat();
      degis(p => { p.notes.push({ id: uid(), nodeId: id, text: txt, at: now() }); ui.sel = id; }, 'Not eklendi'); };
    setTimeout(() => m.querySelector('#mNot').focus(), 0);
  });
}
function odaklan(id) {
  if (ui.view === 'kure') { window.kureUc && window.kureUc(id); return; }
  if (!haritaMi()) {
    // liste türü görünümlerde: satırı göster; yoksa hatta geç
    const sat = document.querySelector(`#viewport [data-id="${id}"]`);
    if (sat) { sat.scrollIntoView({ block: 'center', inline: 'nearest' }); return; }
    ui.view = 'hat'; render();
  }
  let n = C.map.get(id), el = null;
  while (n && !(el = document.querySelector(`#hatInner [data-id="${n.id}"]`))) n = C.map.get(n.parentId);
  if (!el) return;
  const r = el.getBoundingClientRect(), v = vp.getBoundingClientRect();
  ui.cam.x += (v.left + v.width / 2) - (r.left + r.width / 2);
  ui.cam.y += (v.top + v.height / 3) - (r.top + r.height / 2);
  kameraUygula(); baglantilariCiz();
}

function isMenusu(n) {
  const p = P(), kids = C.kids(n.id), asama = !n.parentId, yaprak = !kids.length;
  const kardes = C.kids(n.parentId), ki = kardes.findIndex(x => x.id === n.id);
  const sonraki = kardes[ki + 1];
  const etk = C.etk.get(n.id);
  const durumAlt = yaprak
    ? Object.entries(DURUM).map(([k, v]) => ({ t: `<i class="dot s-${k}"></i> ${v}`, ok: n.status === k, a: () => degis(() => n.status = k, `"${n.title}": ${v}`) }))
    : [{ t: '<i class="dot s-tamam"></i> Tümünü tamamla', a: () => topluDurum(n.id, 'tamam') },
       { t: '<i class="dot s-devam"></i> Tümü devam ediyor', a: () => topluDurum(n.id, 'devam') },
       { t: '<i class="dot s-onayda"></i> Tümü onayda', a: () => topluDurum(n.id, 'onayda') },
       { t: '<i class="dot s-baslamadi"></i> Tümünü sıfırla', a: () => topluDurum(n.id, 'baslamadi') }];
  const etiketAlt = [
    ...p.tags.map(t => {
      const kendi = (n.tags || []).includes(t), miras = !kendi && etk.has(t);
      return { t: esc(t) + (miras ? ' <small>(üstten)</small>' : ''), ok: kendi ? true : miras ? 'miras' : false, dis: miras,
        a: () => degis(() => n.tags = kendi ? n.tags.filter(x => x !== t) : [...(n.tags || []), t], kendi ? `${t} etiketi kaldırıldı` : `${t} etiketi eklendi`) };
    }),
    '-', { t: 'Yeni etiket…', a: () => { yenidenAdlandir(n.id); setTimeout(() => $('#fEtiket') && $('#fEtiket').focus(), 0); } }];
  const ekleAlt = asama
    ? [{ t: 'İçine adım ekle', a: () => altIsModal(n.id) },
       { t: 'Önüne aşama ekle', a: () => asamaEkleModal(ki) },
       { t: 'Arkasına aşama ekle', a: () => asamaEkleModal(ki + 1) }]
    : [{ t: 'Alt iş ekle', a: () => altIsModal(n.id) },
       { t: 'Üstüne adım ekle', a: () => altIsModal(n.parentId, n.id) },
       { t: 'Altına adım ekle', a: () => altIsModal(n.parentId, sonraki ? sonraki.id : '') }];
  const sirala = asama
    ? [{ t: '← Sola (öne) al', dis: ki === 0, a: () => degis(() => siraDegis(n, -1), 'Sıra değişti') },
       { t: '→ Sağa (arkaya) al', dis: ki === kardes.length - 1, a: () => degis(() => siraDegis(n, 1), 'Sıra değişti') }]
    : [{ t: '↑ Yukarı', dis: ki === 0, a: () => degis(() => siraDegis(n, -1), 'Sıra değişti') },
       { t: '↓ Aşağı', dis: ki === kardes.length - 1, a: () => degis(() => siraDegis(n, 1), 'Sıra değişti') },
       { t: 'Aşama yap (hatta çıkar)', a: () => tasi(n.id, null, C.kids(null).findIndex(a => a.id === ata(n.id)[0].id) + 1) }];
  return [
    kids.length && { t: kapali.has(n.id) ? '▸ Genişlet' : '▾ Daralt', a: () => daralt(n.id) },
    asama && { t: 'Diğer aşamaları daralt', a: () => hepsiniDaralt(true, n.id) },
    { t: 'Buna odaklan', a: () => { sec(n.id); odaklan(n.id); } },
    '-',
    { t: 'Durum', alt: durumAlt },
    { t: esc(SOZ().bekleyen) + ' ekle…', a: () => bekleyenModal(n.id) },
    { t: 'Not ekle…', a: () => notModal(n.id) },
    { t: 'Etiketler', alt: etiketAlt },
    '-',
    { t: 'Yeniden adlandır', k: 'F2', a: () => yenidenAdlandir(n.id) },
    { t: 'Ekle', alt: ekleAlt },
    { t: 'Sırala', alt: sirala },
    '-',
    { t: 'Kopyala', k: 'Ctrl+C', a: () => kopyala(n.id) },
    { t: 'Çoğalt', k: 'Ctrl+D', a: () => cogalt(n.id) },
    pano && { t: 'Yapıştır', alt: [
      { t: 'Arkasına yapıştır', k: 'Ctrl+V', a: () => sonrasinaYapistir(n.id) },
      { t: 'İçine yapıştır (alt iş olarak)', a: () => yapistir(n.id, kids.length) }] },
    '-',
    { t: 'Sil', k: 'Del', cls: 'danger', a: () => silSor(n.id) },
  ];
}
function bosMenu() {
  const n = C.kids(null).length;
  return [
    { t: 'Yeni aşama ekle (sona)', a: () => asamaEkleModal(n) },
    pano && { t: `Yapıştır: "${esc(pano.baslik)}" (sona, aşama olarak)`, a: () => yapistir(null, n) },
    '-',
    { t: 'Tümünü daralt', a: () => hepsiniDaralt(true) },
    { t: 'Tümünü genişlet', a: () => hepsiniDaralt(false) },
    { t: 'Sığdır', a: () => sigdir() },
    '-',
    { t: 'Geri al', k: 'Ctrl+Z', dis: !geriYigin.length, a: geriAl },
    { t: 'Yinele', k: 'Ctrl+Y', dis: !ileriYigin.length, a: yinele },
  ];
}
document.addEventListener('contextmenu', e => {
  if (tas) { e.preventDefault(); return; }
  if (e.target.closest('#ctx')) { e.preventDefault(); return; }
  if (!$('#viewport').contains(e.target) || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const d = e.target.closest('[data-id]');
  e.preventDefault();
  if (d && C.map.has(d.dataset.id)) {
    const n = C.map.get(d.dataset.id);
    if (ui.sel !== n.id) sec(n.id);
    ctxAc(e.clientX, e.clientY, n.title, isMenusu(n));
  } else if (haritaMi()) ctxAc(e.clientX, e.clientY, P().name, bosMenu());
  else ctxKapat();
});
$('#modalBg').addEventListener('click', e => { if (e.target.id === 'modalBg') modalKapat(); });
window.addEventListener('resize', () => haritaMi() && baglantilariCiz());

/* ---------- harita kamerası: tekerlek = yakınlaş, sürükle = kaydır, iki parmak = yakınlaş ---------- */
function kameraUygula() {
  const k = $('#hatInner'); if (!k) return;
  k.style.transform = `translate(${ui.cam.x}px,${ui.cam.y}px) scale(${ui.cam.s})`;
  const z = $('#zoomPct'); if (z) z.textContent = '%' + Math.round(ui.cam.s * 100);
}
// (mx,my) ekran noktası sabit kalacak şekilde ölçek değiştir
function yakinlas(yeni, mx, my) {
  const v = $('#viewport').getBoundingClientRect();
  if (mx == null) { mx = v.left + v.width / 2; my = v.top + v.height / 3; }
  yeni = Math.min(2.5, Math.max(0.3, yeni));
  const c = ui.cam, ox = mx - v.left, oy = my - v.top;
  // seviye değişecekse imlecin altındaki aşamayı yerinde tut
  let capa = null;
  if (seviye(yeni) !== ui.zoom) {
    if (ui.view !== 'hat') {
      const el = document.elementFromPoint(mx, my)?.closest('#hatInner [data-id]') || $('#hatInner .zd-kok');
      if (el) { const r = el.getBoundingClientRect(); capa = { q: el.dataset.id ? `[data-id="${el.dataset.id}"]` : '.zd-kok', x: r.left, y: r.top }; }
    } else {
      const el = document.elementFromPoint(mx, my)?.closest('.station') || enYakinIstasyon(mx, my);
      if (el) { const h = el.querySelector('.st-head'), r = el.getBoundingClientRect(); capa = { q: `[data-id="${h.dataset.id}"]`, ist: true, x: r.left, y: r.top }; }
    }
  }
  c.x = ox - (ox - c.x) * (yeni / c.s);
  c.y = oy - (oy - c.y) * (yeni / c.s);
  c.s = yeni;
  if (seviye(yeni) !== ui.zoom) {
    ui.zoom = seviye(yeni); render();
    if (capa) {
      let h = document.querySelector('#hatInner ' + capa.q);
      if (h && capa.ist) h = h.closest('.station');
      if (h) {
        const yr = h.getBoundingClientRect();
        c.x += capa.x - yr.left; c.y += capa.y - yr.top; kameraUygula(); // istasyonun köşesi aynı yerde kalsın
      }
    }
  } else kameraUygula();
}
function enYakinIstasyon(mx) {
  let en = null, d = 1e9;
  const my = arguments[1];
  document.querySelectorAll('#hatInner .station').forEach(el => { const r = el.getBoundingClientRect(); const dd = ui.dikey && my != null ? Math.abs(r.top + r.height / 2 - my) : Math.abs(r.left + r.width / 2 - mx); if (dd < d) { d = dd; en = el; } });
  return en;
}
function sigdir() {
  const v = $('#viewport'); if (!$('#hatInner')) return;
  // en fazla iki tur: seviye değişirse yeni genişliğe göre bir kez daha hesapla, sonra dur
  for (let i = 0; i < 2; i++) {
    const k = $('#hatInner');
    const s = Math.min(1.05, Math.max(0.3, ui.dikey || ui.view !== 'hat' ? Math.min((v.clientWidth - 20) / k.offsetWidth, (v.clientHeight - 20) / k.offsetHeight) : (v.clientWidth - 20) / k.offsetWidth));
    ui.cam = { x: 10, y: 0, s };
    if (seviye(s) === ui.zoom) break;
    ui.zoom = seviye(s); render();
  }
  kameraUygula();
}

const vp = $('#viewport');
vp.addEventListener('scroll', () => { if (haritaMi() && (vp.scrollLeft || vp.scrollTop)) { vp.scrollLeft = 0; vp.scrollTop = 0; } });
vp.addEventListener('wheel', e => {
  if (!haritaMi()) return;
  e.preventDefault();
  if (e.shiftKey) { ui.cam.x -= (e.deltaY || e.deltaX); kameraUygula(); return; }
  const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)); // ctrlKey = touchpad kıstırma
  yakinlas(ui.cam.s * f, e.clientX, e.clientY);
}, { passive: false });

const imlecler = new Map();
let surukle = null, surukleBitti = 0, kistir = null;
vp.addEventListener('pointerdown', e => {
  if (!haritaMi() || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const tutulan = ui.view === 'hat' && !e.target.closest('button') && e.target.closest('#hatInner .card, #hatInner .st-head, #hatInner .chip');
  if (tutulan && imlecler.size === 0) {
    tasHazirla(tutulan, e);
    if (e.pointerType === 'mouse') return; // fare: kaydırma başlamasın
  }
  imlecler.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (imlecler.size === 1) surukle = { x0: e.clientX, y0: e.clientY, cx: ui.cam.x, cy: ui.cam.y, oynadi: false, id: e.pointerId };
  if (imlecler.size === 2) {
    const [a, b] = [...imlecler.values()];
    kistir = { d: Math.hypot(a.x - b.x, a.y - b.y), s: ui.cam.s }; surukle = null;
  }
});
vp.addEventListener('pointermove', e => {
  if (tas && tas.pid === e.pointerId && tasHareket(e)) return;
  if (!imlecler.has(e.pointerId)) return;
  imlecler.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (kistir && imlecler.size === 2) {
    const [a, b] = [...imlecler.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    yakinlas(kistir.s * d / kistir.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    surukleBitti = performance.now(); return;
  }
  if (!surukle) return;
  const dx = e.clientX - surukle.x0, dy = e.clientY - surukle.y0;
  if (!surukle.oynadi && Math.hypot(dx, dy) < 5) return;
  if (!surukle.oynadi) { surukle.oynadi = true; vp.setPointerCapture(e.pointerId); vp.classList.add('suruk'); }
  ui.cam.x = surukle.cx + dx; ui.cam.y = surukle.cy + dy; kameraUygula();
});
const birak = e => {
  if (tas && tas.pid === e.pointerId) { const aktifti = tas.aktif; tasBitir(e, e.type === 'pointercancel'); if (aktifti) { imlecler.delete(e.pointerId); surukle = null; vp.classList.remove('suruk'); return; } }
  imlecler.delete(e.pointerId);
  if (surukle && surukle.oynadi) surukleBitti = performance.now();
  if (imlecler.size < 2) kistir = null;
  if (!imlecler.size) { surukle = null; vp.classList.remove('suruk'); }
};
vp.addEventListener('pointerup', birak);
vp.addEventListener('pointercancel', birak);
vp.addEventListener('dblclick', e => { if (haritaMi() && !e.target.closest('[data-id]')) sigdir(); });

/* ---------- tut-sürükle-bırak (hat görünümü) ----------
   Kart, aşama başlığı ya da parsiyel çipi sürüklenir. Bırakılan yere göre:
   kartların arası → oraya taşı · kartın ortası → onun alt işi yap ·
   aşama başlığı → o aşamanın sonuna · hat üzerindeki aralık → aşama olarak ·
   Sil alanı → sil (onaylı). Ctrl ile bırakılırsa kopyalar. */
let tas = null;
function tasHazirla(el, e) {
  tas = { el, id: el.dataset.id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
          aktif: false, dokunma: e.pointerType !== 'mouse', hedef: null, ctrl: false };
  if (tas.dokunma) {
    // dokunmatik: yarım saniye basılı tutunca sürükleme başlar; önce parmak oynarsa harita kayar
    tas.zaman = setTimeout(() => { if (tas && !tas.aktif) { surukle = null; tasBasla(); } }, 450);
  }
}
function tasHareket(e) {
  tas.x = e.clientX; tas.y = e.clientY; tas.ctrl = e.ctrlKey || e.metaKey;
  const yol = Math.hypot(tas.x - tas.x0, tas.y - tas.y0);
  if (!tas.aktif) {
    if (tas.dokunma) { if (yol > 8) { clearTimeout(tas.zaman); tas = null; } return false; } // kaydırma devam etsin
    if (yol < 5) return true;
    tasBasla();
  }
  tasCiz(); return true;
}
function tasBasla() {
  const el = tas.el, n = C.map.get(tas.id); if (!n) { tas = null; return; }
  tas.aktif = true;
  tas.yasak = new Set([n.id, ...altlar(n.id).map(x => x.id)]);
  tas.asama = !n.parentId;
  try { vp.setPointerCapture(tas.pid); } catch (err) {}
  const r = el.getBoundingClientRect(), s = ui.cam.s;
  tas.off = { x: tas.x0 - r.left, y: tas.y0 - r.top };
  const h = document.createElement('div');
  h.className = 'hayalet s-' + C.eff.get(n.id);
  const kopya = el.cloneNode(true); kopya.classList.remove('sel', 'soluk');
  kopya.style.width = (r.width / s) + 'px';
  h.appendChild(kopya); h.style.transform = `scale(${s}) rotate(1.2deg)`;
  document.body.appendChild(h); tas.hayalet = h;
  el.classList.add('tasinan');
  vp.classList.add('surukleniyor');
  const vr = vp.getBoundingClientRect();
  const cop = document.createElement('div'); cop.id = 'copAlan'; cop.textContent = '🗑  Silmek için buraya bırak';
  cop.style.left = (vr.left + vr.width / 2) + 'px'; cop.style.top = (vr.bottom - 64) + 'px';
  document.body.appendChild(cop); tas.cop = cop;
  const cz = document.createElement('div'); cz.id = 'birakCizgi'; document.body.appendChild(cz); tas.cizgi = cz;
  const et = document.createElement('div'); et.id = 'birakEtiket'; document.body.appendChild(et); tas.etiket = et;
  ctxKapat();
  tas.raf = requestAnimationFrame(tasKenarKaydir);
  tasCiz();
}
// imleç kenara yaklaşınca harita kendiliğinden kaysın
function tasKenarKaydir() {
  if (!tas || !tas.aktif) return;
  const vr = vp.getBoundingClientRect(), k = 50, hiz = 14;
  let dx = 0, dy = 0;
  if (tas.x < vr.left + k) dx = hiz; else if (tas.x > vr.right - k) dx = -hiz;
  if (tas.y < vr.top + k) dy = hiz; else if (tas.y > vr.bottom - k && !tasCopta()) dy = -hiz;
  if (dx || dy) { ui.cam.x += dx; ui.cam.y += dy; kameraUygula(); tasCiz(); }
  tas.raf = requestAnimationFrame(tasKenarKaydir);
}
const icinde = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
const tasCopta = () => tas && tas.cop && icinde(tas.cop.getBoundingClientRect(), tas.x, tas.y);
const kardesler = pid => C.kids(pid).filter(x => !tas.yasak.has(x.id));

function hedefBul() {
  const x = tas.x, y = tas.y, s = ui.cam.s;
  if (tasCopta()) return { tur: 'sil' };
  if (!icinde(vp.getBoundingClientRect(), x, y)) return null;
  const istasyonlar = [...document.querySelectorAll('#hatInner .station')].map(el => {
    const head = el.querySelector('.st-head');
    return { el, head, id: head.dataset.id, r: el.getBoundingClientRect(), hr: head.getBoundingClientRect() };
  });
  if (!istasyonlar.length) return { tur: 'asama', index: 0, cizgi: null };
  if (ui.dikey) return hedefBulDikey(x, y, s, istasyonlar);
  const bandAlt = Math.max(...istasyonlar.map(i => i.hr.bottom));
  const bandUst = Math.min(...istasyonlar.map(i => i.hr.top)) - 60 * s;

  // 1) hat bandı: aşama aralığı ya da aşamanın içine
  if (y <= bandAlt && y >= bandUst) {
    if (!tas.asama) {
      const ic = istasyonlar.find(i => x >= i.r.left + i.r.width * 0.2 && x <= i.r.right - i.r.width * 0.2);
      if (ic && !tas.yasak.has(ic.id)) return { tur: 'icine', parent: ic.id, index: kardesler(ic.id).length, el: ic.head };
    }
    const digerleri = istasyonlar.filter(i => !tas.yasak.has(i.id));
    const gi = digerleri.filter(i => x > i.r.left + i.r.width / 2).length;
    const sol = digerleri[gi - 1], sag = digerleri[gi];
    const cx = sol && sag ? (sol.r.right + sag.r.left) / 2 : sol ? sol.r.right + 6 : sag ? sag.r.left - 6 : x;
    return { tur: 'asama', index: gi, dikey: { x: cx, y1: bandUst + 40 * s, y2: bandAlt } };
  }
  if (y < bandUst) return null;

  // 2) adımlar alanı: imlecin altındaki ya da en yakın aşama sütunu
  let ist = istasyonlar.find(i => x >= i.r.left && x <= i.r.right);
  if (!ist) ist = istasyonlar.reduce((a, b) => Math.abs(b.r.left + b.r.width / 2 - x) < Math.abs(a.r.left + a.r.width / 2 - x) ? b : a);
  if (tas.yasak.has(ist.id)) return null; // aşamayı kendi içine bırakamazsın
  const kartlar = [...ist.el.querySelectorAll(':scope > .steps > .card')].filter(c => !tas.yasak.has(c.dataset.id));
  const liste = kardesler(ist.id);
  const sira = id => liste.findIndex(n => n.id === id);
  for (const c of kartlar) {
    const r = c.getBoundingClientRect();
    if (y < r.top) return { tur: 'ara', parent: ist.id, index: sira(c.dataset.id), yatay: { x1: r.left, x2: r.right, y: r.top - 5 * s } };
    if (y <= r.bottom) {
      const orta = y > r.top + r.height * 0.3 && y < r.bottom - r.height * 0.3;
      if (orta) return { tur: 'alt', parent: c.dataset.id, index: kardesler(c.dataset.id).length, el: c };
      const ust = y < r.top + r.height / 2;
      return { tur: 'ara', parent: ist.id, index: sira(c.dataset.id) + (ust ? 0 : 1), yatay: { x1: r.left, x2: r.right, y: ust ? r.top - 5 * s : r.bottom + 5 * s } };
    }
  }
  const son = kartlar[kartlar.length - 1], rr = (son || ist.head).getBoundingClientRect();
  return { tur: 'ara', parent: ist.id, index: liste.length, yatay: { x1: ist.hr.left + 8 * s, x2: ist.hr.right - 8 * s, y: rr.bottom + 6 * s } };
}

// dikey hat: solda aşama sütunu (hat bandı), sağda her aşamanın kartları yan yana
function hedefBulDikey(x, y, s, istasyonlar) {
  const bandSag = Math.max(...istasyonlar.map(i => i.hr.right));
  const bandSol = Math.min(...istasyonlar.map(i => i.hr.left)) - 60 * s;
  if (x < bandSol) return null;
  if (x <= bandSag) {
    if (!tas.asama) {
      const ic = istasyonlar.find(i => y >= i.r.top + Math.min(i.r.height, i.hr.height) * 0.2 && y <= i.r.top + Math.min(i.r.height, i.hr.height) * 0.8);
      if (ic && !tas.yasak.has(ic.id)) return { tur: 'icine', parent: ic.id, index: kardesler(ic.id).length, el: ic.head };
    }
    const digerleri = istasyonlar.filter(i => !tas.yasak.has(i.id));
    const gi = digerleri.filter(i => y > i.r.top + i.r.height / 2).length;
    const ust = digerleri[gi - 1], alt = digerleri[gi];
    const cy = ust && alt ? (ust.r.bottom + alt.r.top) / 2 : ust ? ust.r.bottom + 6 : alt ? alt.r.top - 6 : y;
    return { tur: 'asama', index: gi, yatay: { x1: bandSol + 40 * s, x2: bandSag, y: cy } };
  }
  let ist = istasyonlar.find(i => y >= i.r.top && y <= i.r.bottom);
  if (!ist) ist = istasyonlar.reduce((a, b) => Math.abs(b.r.top + b.r.height / 2 - y) < Math.abs(a.r.top + a.r.height / 2 - y) ? b : a);
  if (tas.yasak.has(ist.id)) return null;
  const kartlar = [...ist.el.querySelectorAll(':scope > .steps > .card')].filter(c => !tas.yasak.has(c.dataset.id));
  const liste = kardesler(ist.id);
  const sira = id => liste.findIndex(n => n.id === id);
  for (const c of kartlar) {
    const r = c.getBoundingClientRect();
    if (x < r.left) return { tur: 'ara', parent: ist.id, index: sira(c.dataset.id), dikey: { x: r.left - 5 * s, y1: r.top, y2: r.bottom } };
    if (x <= r.right) {
      const orta = x > r.left + r.width * 0.3 && x < r.right - r.width * 0.3;
      if (orta) return { tur: 'alt', parent: c.dataset.id, index: kardesler(c.dataset.id).length, el: c };
      const sol = x < r.left + r.width / 2;
      return { tur: 'ara', parent: ist.id, index: sira(c.dataset.id) + (sol ? 0 : 1), dikey: { x: sol ? r.left - 5 * s : r.right + 5 * s, y1: r.top, y2: r.bottom } };
    }
  }
  const son = kartlar[kartlar.length - 1], rr = (son || ist.head).getBoundingClientRect();
  return { tur: 'ara', parent: ist.id, index: liste.length, dikey: { x: rr.right + 6 * s, y1: ist.hr.top + 8 * s, y2: ist.hr.bottom - 8 * s } };
}

function tasCiz() {
  const h = tas.hayalet; h.style.left = (tas.x - tas.off.x) + 'px'; h.style.top = (tas.y - tas.off.y) + 'px';
  const hd = hedefBul(); tas.hedef = hd;
  document.querySelectorAll('.birak-hedef').forEach(x => x.classList.remove('birak-hedef'));
  const cz = tas.cizgi; cz.className = ''; cz.style.display = 'none';
  tas.cop.classList.toggle('aktif', !!hd && hd.tur === 'sil');
  if (hd && hd.el) hd.el.classList.add('birak-hedef');
  if (hd && hd.yatay) { cz.className = 'yatay'; cz.style.display = 'block'; Object.assign(cz.style, { left: hd.yatay.x1 + 'px', top: hd.yatay.y + 'px', width: (hd.yatay.x2 - hd.yatay.x1) + 'px', height: '' }); }
  if (hd && hd.dikey) { cz.className = 'dikey'; cz.style.display = 'block'; Object.assign(cz.style, { left: hd.dikey.x + 'px', top: hd.dikey.y1 + 'px', height: Math.max(20, hd.dikey.y2 - hd.dikey.y1) + 'px', width: '' }); }
  const ad = id => '"' + (C.map.get(id) || {}).title + '"';
  const kopya = tas.ctrl && hd && hd.tur !== 'sil';
  const metin = !hd ? 'Buraya bırakılamaz'
    : hd.tur === 'sil' ? 'Sil'
    : hd.tur === 'asama' ? 'Aşama olarak buraya'
    : hd.tur === 'icine' ? ad(hd.parent) + ' aşamasının sonuna'
    : hd.tur === 'alt' ? ad(hd.parent) + ' altına (alt iş)'
    : 'Buraya';
  tas.etiket.textContent = (kopya ? '⧉ Kopyala: ' : '') + metin + (hd && hd.tur !== 'sil' && !kopya ? '   ·   Ctrl: kopyala' : '');
  tas.etiket.className = !hd ? 'yok' : hd.tur === 'sil' ? 'sil' : '';
  tas.etiket.style.left = (tas.x + 16) + 'px'; tas.etiket.style.top = (tas.y + 18) + 'px';
}

function tasTemizle() {
  if (!tas) return;
  clearTimeout(tas.zaman); cancelAnimationFrame(tas.raf);
  ['hayalet', 'cop', 'cizgi', 'etiket'].forEach(k => tas[k] && tas[k].remove());
  document.querySelectorAll('.birak-hedef, .tasinan').forEach(x => x.classList.remove('birak-hedef', 'tasinan'));
  vp.classList.remove('surukleniyor');
  tas = null;
}
function tasIptal() { tasTemizle(); surukleBitti = performance.now(); toast('Taşıma iptal edildi'); }
function tasBitir(e, iptal) {
  if (!tas.aktif) { clearTimeout(tas.zaman); tas = null; return; } // sürükleme olmadı: normal tıklama
  tas.ctrl = e.ctrlKey || e.metaKey;
  const { id, hedef, ctrl } = tas; tasTemizle(); surukleBitti = performance.now();
  if (iptal || !hedef) return;
  const n = C.map.get(id); if (!n) return;
  if (hedef.tur === 'sil') {
    const say = altlar(id).length;
    if (confirm(`"${n.title}"${say ? ` ve altındaki ${say} iş` : ''} silinsin mi?`)) dugumSil(id);
    return;
  }
  const parent = hedef.tur === 'asama' ? null : hedef.parent;
  if (ctrl) { kopyaBirak(id, parent, hedef.index); return; }
  tasi(id, parent, hedef.index);
}
function tasi(id, parentId, index) {
  const n0 = C.map.get(id), eski = n0.parentId;
  const hedefAd = parentId ? C.map.get(parentId).title : 'hat';
  degis(p => {
    const n = p.nodes.find(x => x.id === id);
    const sirala = l => l.sort((a, b) => a.order - b.order);
    const yeni = sirala(p.nodes.filter(x => x.parentId === parentId && x.id !== id));
    yeni.splice(Math.max(0, Math.min(index, yeni.length)), 0, n);
    n.parentId = parentId; yeni.forEach((x, k) => x.order = k);
    if (eski !== parentId) sirala(p.nodes.filter(x => x.parentId === eski)).forEach((x, k) => x.order = k);
    ui.sel = id;
  }, eski === parentId ? 'Sıra değişti' : parentId ? `"${n0.title}" → "${hedefAd}" altına taşındı` : `"${n0.title}" artık bir aşama`);
}
function kopyaBirak(id, parentId, index) {
  const eskiPano = pano, kok = C.map.get(id);
  pano = { kokId: id, baslik: kok.title, nodes: JSON.parse(JSON.stringify([kok, ...altlar(id)])) };
  yapistir(parentId, index);
  pano = eskiPano; render();
}

/* ---------- yön ---------- */
function yonAyarla(dikey) {
  ui.dikey = dikey;
  try { localStorage.setItem('projeHatti.yon', dikey ? 'dikey' : 'yatay'); } catch (e) {}
  if (ui.view !== 'hat') ui.view = 'hat';
  render(); sigdir(); log('Hat: ' + (dikey ? 'dikey' : 'yatay'), 'gorunum');
}

/* ---------- komut satırı ve işlem kaydı ----------
   Yapılan her işlem saatiyle burada listelenir (tarayıcıda son 300 satır).
   Alttaki kutu hem komut hem hızlı not kabul eder. */
const KAYIT_KEY = 'projeHatti.kayit', KAYIT_SINIR = 300;
let kayit = (() => { try { return JSON.parse(localStorage.getItem(KAYIT_KEY) || '[]'); } catch (e) { return []; } })();
let komutGecmisi = [], komutSira = 0;
function kayitKaydet() { try { localStorage.setItem(KAYIT_KEY, JSON.stringify(kayit.slice(-KAYIT_SINIR))); } catch (e) {} }
function log(m, tur = 'bilgi', id = null) {
  if (!m) return;
  m = String(m).replace(/^[↶↷]\s*/, '');
  const son = kayit[kayit.length - 1], t = Date.now();
  // aynı mesaj az önce yazıldıysa (ör. işlem + bildirimi) tekrar etme
  if (son && t - son.t < 1500 && son.m.replace(/\s+\(\d+ adım daha\)$/, '') === m.replace(/\s+\(\d+ adım daha\)$/, '')) return;
  kayit.push({ t, m, tur, id: id || null, p: typeof S !== 'undefined' && S ? S.activeId : null });
  if (kayit.length > KAYIT_SINIR) kayit = kayit.slice(-KAYIT_SINIR);
  kayitKaydet(); konsolSatir(kayit[kayit.length - 1]);
}
const saat = t => new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
function satirHTML(k) {
  const tik = k.id ? ` data-kgo="${k.id}" title="Bu işe git"` : '';
  return `<div class="ks ks-${k.tur}"${tik}><span class="ks-z">${saat(k.t)}</span><span class="ks-m">${k.html || esc(k.m)}</span></div>`;
}
function konsolSatir(k) {
  const el = $('#konsolLog'); if (!el) return;
  if (k.p && S && k.p !== S.activeId) return;
  const altta = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  const bos = el.querySelector('.ks-bos'); if (bos) bos.remove();
  el.insertAdjacentHTML('beforeend', satirHTML(k));
  if (altta) el.scrollTop = el.scrollHeight;
}
function konsolCiz() {
  const el = $('#konsolLog'); if (!el) return;
  const l = kayit.filter(k => !k.p || k.p === S.activeId);
  el.innerHTML = l.length ? l.map(satirHTML).join('') : '<div class="ks ks-bilgi ks-bos"><span class="ks-z"></span><span class="ks-m">Henüz işlem yok. Komutlar için <b>?</b> yaz.</span></div>';
  el.scrollTop = el.scrollHeight;
}
function konsolAcKapa(ac) {
  const k = $('#konsol'); const kapali_ = ac === undefined ? !k.classList.contains('dar') : !ac;
  k.classList.toggle('dar', kapali_); $('#btnKonsol').textContent = kapali_ ? '▴' : '▾';
  $('#btnKonsol').title = kapali_ ? 'Kaydı göster' : 'Kaydı gizle';
  try { localStorage.setItem('projeHatti.konsol', kapali_ ? 'dar' : 'acik'); } catch (e) {}
  if (!kapali_) konsolCiz();
  if (haritaMi()) requestAnimationFrame(baglantilariCiz);
}
// komut satırı yüksekliği: üst kenarından sürükleyerek
(function () {
  const tut = $('#konsolTut'), logEl = $('#konsolLog'); if (!tut) return;
  try { const h = +localStorage.getItem('projeHatti.konsolH'); if (h) logEl.style.height = h + 'px'; } catch (e) {}
  try { if (localStorage.getItem('projeHatti.konsol') === 'dar') konsolAcKapa(false); } catch (e) {}
  let bas = null;
  tut.addEventListener('pointerdown', e => { bas = { y: e.clientY, h: logEl.offsetHeight }; tut.setPointerCapture(e.pointerId); e.preventDefault(); });
  tut.addEventListener('pointermove', e => { if (!bas) return; const h = Math.max(40, Math.min(innerHeight * 0.6, bas.h + bas.y - e.clientY)); logEl.style.height = h + 'px'; });
  tut.addEventListener('pointerup', () => { if (!bas) return; bas = null; try { localStorage.setItem('projeHatti.konsolH', logEl.offsetHeight); } catch (e) {} if (ui.view === 'hat') baglantilariCiz(); });
})();

const katla = s => norm(s).replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
function isBul(ad) {
  const q = katla(ad); if (!q) return [];
  const puan = n => { const t = katla(n.title); return t === q ? 0 : t.startsWith(q) ? 1 : t.includes(q) ? 2 : 9; };
  return P().nodes.map(n => [puan(n), n]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].title.length - b[1].title.length).map(x => x[1]);
}
function yaz(m, tur = 'yardim', html) { kayit.push({ t: Date.now(), m, html, tur, p: S.activeId }); kayitKaydet(); konsolSatir(kayit[kayit.length - 1]); }
const KOMUTLAR = [
  ['git <ad>', 'İşi bulur, seçer ve ona odaklanır (bul, ara)'],
  ['ekle aşama <ad>', 'Sona yeni aşama ekler'],
  ['ekle adım <ad>', 'Seçili aşamaya ya da seçili işin arkasına adım ekler'],
  ['durum tamam|devam|onay|başlamadı', 'Seçili işin durumunu değiştirir'],
  ['sil', 'Seçili işi siler (onaylı)'],
  ['kopyala · yapıştır · çoğalt', 'Seçili iş için'],
  ['daralt [ad|hepsi] · genişlet [ad|hepsi]', 'Aşamaları daraltır/genişletir'],
  ['dikey · yatay', 'Hattın yönünü değiştirir'],
  ['hat · ağaç · zihin · küre · güneş · ağ · pano · sıradaki · liste · matris · gantt · takvim · gösterge · kişiler · bekleyenler', 'Görünüm değiştirir'],
  ['tarih <gün|+7|bugün> · başla <gün>', 'Seçili işin bitiş / başlangıç tarihi (ör. tarih 2026-11-20, tarih +7)'],
  ['planla', 'Tarihleri bağımlılıklara göre otomatik dağıtır'],
  ['sığdır (z)', 'Tüm hattı ekrana sığdırır'],
  ['geri (u) · yinele', 'Geri al / yinele'],
  ['tema açık|koyu|sistem', 'Temayı değiştirir'],
  ['temizle', 'Bu kaydı temizler'],
  ['düz metin', 'Seçili işe not olarak yazar'],
];
function komut(txt) {
  txt = (txt || '').trim(); if (!txt) return;
  const inp = $('#quickIn');
  // hızlı not sözdizimi (#, @, !) doğrudan
  if (/^[#@!]/.test(txt)) { yaz('› ' + txt, 'komut'); hizliNot(txt); return; }
  const [ilk, ...geri] = txt.split(/\s+/), k = katla(ilk), arg = geri.join(' ');
  const sel = ui.sel && C.map.get(ui.sel);
  const secGerek = () => { if (!sel) { toast('Önce bir iş seç (ya da: git <ad>)'); return true; } return false; };
  const bitti = () => { inp.value = ''; };
  const gor = { hat: 'hat', matris: 'matris', liste: 'liste', kure: 'kure', zihin: 'zihin', mindmap: 'zihin', agac: 'agac', tree: 'agac', bekleyenler: 'rapor', bekleyen: 'rapor',
    pano: 'pano', kanban: 'pano', siradaki: 'odak', odak: 'odak', ag: 'ag', gantt: 'gantt', takvim: 'takvim', gosterge: 'gosterge', panel: 'gosterge', gunes: 'gunes', kisiler: 'kisiler' };
  yaz('› ' + txt, 'komut');
  if (k === '' && ilk === '?' || ['yardim', 'help', 'komutlar'].includes(k)) {
    yaz('Komutlar (↑/↓ önceki komutlar, Esc temizler):');
    const o = ornekNot();
    [...KOMUTLAR.slice(0, -1), [o.bek, `Hızlı not: ${o.bekAciklama}`], [o.tamam, `Hızlı not: durumu “${SOZ().durum.tamam}” yapar`], KOMUTLAR[KOMUTLAR.length - 1]]
      .forEach(([c, a]) => yaz('', 'yardim', `<a data-kkomut="${esc(c.split(/[ <|·[]/)[0])}">${esc(c)}</a> — ${esc(a)}`));
    return bitti();
  }
  if (['geri', 'u', 'undo'].includes(k)) { geriAl(); return bitti(); }
  if (['yinele', 'redo'].includes(k)) { yinele(); return bitti(); }
  if (gor[k]) { ui.view = gor[k]; render(); log('Görünüm: ' + ilk, 'gorunum'); return bitti(); }
  if (k === 'dikey' || k === 'yatay') { yonAyarla(k === 'dikey'); return bitti(); }
  if (['sigdir', 'z', 'fit'].includes(k)) { if (!haritaMi()) { ui.view = 'hat'; render(); } sigdir(); return bitti(); }
  if (['temizle', 'cls'].includes(k)) { kayit = kayit.filter(x => x.p && x.p !== S.activeId); kayitKaydet(); konsolCiz(); return bitti(); }
  if (k === 'tema') { const h = katla(arg); tema = h.startsWith('k') ? 'koyu' : h.startsWith('a') ? 'acik' : 'sistem'; try { localStorage.setItem('projeHatti.tema', tema); } catch (e) {} temaUygula(); toast('Tema: ' + TEMA_AD[tema].slice(2)); return bitti(); }
  if (['daralt', 'genislet'].includes(k)) {
    const kapat = k === 'daralt';
    if (!arg) { if (secGerek()) return; daralt(sel.id, kapat); return bitti(); }
    if (['hepsi', 'tum', 'tumu', 'tumunu'].includes(katla(arg))) { hepsiniDaralt(kapat); return bitti(); }
    const b = isBul(arg).filter(n => C.kids(n.id).length); if (!b.length) { toast('Bulunamadı: ' + arg); return; }
    daralt(b[0].id, kapat); return bitti();
  }
  if (['git', 'bul', 'ara', 'sec'].includes(k)) {
    const b = isBul(arg); if (!b.length) { toast('Bulunamadı: ' + arg); return; }
    if (!haritaMi() && ui.view !== 'kure') { ui.view = 'hat'; }
    const ilkBulunan = b[0]; ata(ilkBulunan.id).forEach(a => kapali.delete(a.id)); kapaliKaydet();
    sec(ilkBulunan.id); odaklan(ilkBulunan.id);
    if (b.length > 1) yaz('', 'yardim', `${b.length} eşleşme: ` + b.slice(0, 8).map(n => `<a data-kgo="${n.id}">${esc(n.title)}</a>`).join(' · ') + (b.length > 8 ? ' …' : ''));
    return bitti();
  }
  if (k === 'ekle') {
    const [tip, ...adP] = arg.split(/\s+/), ad = adP.join(' ').trim(), t2 = katla(tip || '');
    if (!ad) { toast('Kullanım: ekle aşama <ad>  ya da  ekle adım <ad>'); return; }
    if (t2.startsWith('asama')) { degis(p => { const n = node(p, { title: ad, parentId: null, order: C.kids(null).length }); ui.sel = n.id; }, `Aşama eklendi: ${ad}`); return bitti(); }
    if (t2.startsWith('adim') || t2.startsWith('is')) {
      if (secGerek()) return;
      const parent = sel.parentId ? sel.parentId : sel.id;
      const sira = sel.parentId ? C.kids(parent).findIndex(x => x.id === sel.id) + 1 : C.kids(parent).length;
      degis(p => { const n = node(p, { title: ad, parentId: parent }); const l = C.kids(parent).slice(); l.splice(sira, 0, n); l.forEach((x, i) => x.order = i); ui.sel = n.id; },
        `Adım eklendi: ${ad} → ${C.map.get(parent).title}`);
      return bitti();
    }
    toast('Kullanım: ekle aşama <ad>  ya da  ekle adım <ad>'); return;
  }
  if (k === 'durum') {
    if (secGerek()) return; const h = katla(arg);
    const st = h.startsWith('tam') || h.startsWith('bit') ? 'tamam' : h.startsWith('dev') ? 'devam' : h.startsWith('ona') ? 'onayda' : h.startsWith('bas') ? 'baslamadi' : null;
    if (!st) { toast('Kullanım: durum tamam|devam|onay|başlamadı'); return; }
    C.kids(sel.id).length ? topluDurum(sel.id, st) : degis(() => sel.status = st, `"${sel.title}": ${DURUM[st]}`); return bitti();
  }
  if (['sil', 'del'].includes(k)) { if (secGerek()) return; silSor(sel.id); return bitti(); }
  if (['kopyala', 'copy'].includes(k)) { if (secGerek()) return; kopyala(sel.id); return bitti(); }
  if (['cogalt'].includes(k)) { if (secGerek()) return; cogalt(sel.id); return bitti(); }
  if (['yapistir', 'paste'].includes(k)) { if (!pano) { toast('Pano boş'); return; } sel ? sonrasinaYapistir(sel.id) : yapistir(null, C.kids(null).length); return bitti(); }
  if (window.KOMUT_EK && KOMUT_EK(k, arg, sel)) return bitti();
  // komut değilse: hızlı not (seçili işe not)
  hizliNot(txt);
}

/* ---------- dışa / içe aktarma ---------- */
function disaAktar() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `proje-hatti-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function iceAktar(f) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (!d || !Array.isArray(d.projects)) throw new Error('Geçersiz dosya');
      const ad = d.projects.map(p => p.name).join(', ');
      if (!confirm(`Dosyadaki projeler: ${ad}\n\nAynı projeler varsa üzerine yazılacak, diğerleri korunacak. Devam?`)) return;
      d.projects.forEach(p => { const i = S.projects.findIndex(x => x.id === p.id); if (i >= 0) S.projects[i] = p; else S.projects.push(p); });
      S.activeId = d.projects[0].id; ui.sel = null; sonMesaj = 'İçe aktarma'; save(); render(); toast('İçe aktarıldı');
    } catch (e) { toast('Okunamadı: ' + e.message); }
    $('#fileImport').value = '';
  };
  r.readAsText(f);
}

/* ---------- tema: sistem / açık / koyu ---------- */
const TEMA_AD = { sistem: '◐ Sistem', acik: '☀ Açık', koyu: '☾ Koyu' };
let tema = (() => { try { return localStorage.getItem('projeHatti.tema') || 'sistem'; } catch (e) { return 'sistem'; } })();
const sistemKoyu = matchMedia('(prefers-color-scheme: dark)');
function temaUygula() {
  const koyu = tema === 'koyu' || (tema === 'sistem' && sistemKoyu.matches);
  document.documentElement.dataset.theme = koyu ? 'dark' : 'light';
  const b = $('#btnTema'); if (b) { b.textContent = TEMA_AD[tema].slice(0, 1); b.title = 'Tema: ' + TEMA_AD[tema].slice(2) + ' (değiştirmek için tıkla)'; }
  if (typeof ui !== 'undefined' && ui.view === 'kure' && C) render(); // 3B renkleri temadan okunur
}
function temaDegis() {
  tema = { sistem: 'acik', acik: 'koyu', koyu: 'sistem' }[tema];
  try { localStorage.setItem('projeHatti.tema', tema); } catch (e) {}
  temaUygula(); toast('Tema: ' + TEMA_AD[tema].slice(2));
}
sistemKoyu.addEventListener('change', temaUygula);
temaUygula();

render();
gecmisDugmeleri();
konsolCiz();
