/* Yapay Zeki · beyin
   Kural tabanlı beceriler (saat, hesap, hava, döviz, sözlük, Vikipedi, site içinde gezinme, zamanlayıcı, not, oyunlar…)
   ve isteğe bağlı cihazda çalışan dil modeli (sohbet) için ortak giriş: Beyin.yanitla(metin) → { metin, duygu, eylem }
   duygu: mutlu | saskin | uzgun | utangac | dusunceli | heyecanli | uykulu | notr
   eylem: { tip: 'ac', url } | { tip: 'dans' } | { tip: 'uyku' } | { tip: 'uyan' } | { tip: 'zamanlayici', sn, ad } | { tip: 'sus' } */
(function () {
  'use strict';
  const KAYNAK = (document.currentScript && document.currentScript.src) || location.href;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const kucuk = s => String(s || '').toLocaleLowerCase('tr');
  const fold = s => kucuk(s).replace(/[âà]/g, 'a').replace(/[îı]/g, 'i').replace(/û/g, 'u').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u');
  const temiz = s => kucuk(s).replace(/[“”"«»]/g, '').replace(/\s+/g, ' ').trim();
  const sec = a => a[Math.floor(Math.random() * a.length)];
  const HARF = 'a-zçğıöşüâîû';
  const sayi = (n, k = 2) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: k });
  const HAFIZA = { ad: LS.get('zeki:ad') || '', sehir: LS.get('zeki:sehir') || '', notlar: JSON.parse(LS.get('zeki:notlar') || '[]') };
  const kaydet = () => { LS.set('zeki:ad', HAFIZA.ad); LS.set('zeki:sehir', HAFIZA.sehir); LS.set('zeki:notlar', JSON.stringify(HAFIZA.notlar.slice(-30))); };
  const adla = (s, ek) => HAFIZA.ad ? s.replace('{ad}', (ek || '') + HAFIZA.ad) : s.replace(/\s*\{ad\}/, '');
  const fetchJ = async (u, ms = 7000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(u, { signal: c.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); } };
  /* Türkçe ek atma: "İstanbul'da" → "İstanbul" */
  const eksiz = s => s.replace(/['’][a-zçğıöşü]+$/i, '').trim();

  /* ---------------- sayı sözcükleri ---------------- */
  const BIR = { sıfır: 0, bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8, dokuz: 9 };
  const ON = { on: 10, yirmi: 20, otuz: 30, kırk: 40, elli: 50, altmış: 60, yetmiş: 70, seksen: 80, doksan: 90 };
  function sozcuktenSayi(s) {
    return s.replace(new RegExp(`(?<![${HARF}])(?:(?:sıfır|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|bin|milyon)(?![${HARF}])\\s*)+`, 'g'), m => {
      const w = m.trim().split(/\s+/); let top = 0, ara = 0, kul = false;
      for (const x of w) {
        if (x in BIR) { ara += BIR[x]; kul = true; } else if (x in ON) { ara += ON[x]; kul = true; }
        else if (x === 'yüz') { ara = (ara || 1) * 100; kul = true; } else if (x === 'bin') { top += (ara || 1) * 1000; ara = 0; kul = true; }
        else if (x === 'milyon') { top += (ara || 1) * 1e6; ara = 0; kul = true; }
      }
      return kul ? (top + ara) + (m.endsWith(' ') ? ' ' : '') : m;
    });
  }

  /* ---------------- hesap ---------------- */
  function hesapla(s0) {
    let s = sozcuktenSayi(temiz(s0)).replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s*['’]?\s*(?:[nd]?[aeıiuüoö]n|[nd]?[iıuü]n|n[iıuü]n)?\s+yüzde\s*(\d+(?:\.\d+)?)\s*['’]?\s*[a-zçğıöşü]*/g, '($1*$2/100)');
    s = s.replace(/yüzde\s*(\d+(?:\.\d+)?)\s*['’]?[a-zçğıöşü]*\s+(?:of\s+)?(\d+(?:\.\d+)?)/g, '($2*$1/100)');
    s = s.replace(/karekök(?:ü)?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*['’]?[a-zçğıöşü]*\s+karekök[a-zçğıöşü]*/g, (m, a, b) => `sqrt(${a || b})`);
    s = s.replace(/(\d+(?:\.\d+)?)\s*['’]?\s*[a-zçğıöşü]*\s*(?:karesi)/g, '($1^2)').replace(/(\d+(?:\.\d+)?)\s*['’]?\s*[a-zçğıöşü]*\s*(?:küpü)/g, '($1^3)');
    const kel = (w, r) => { s = s.replace(new RegExp(`(?<![${HARF}])(?:${w})(?![${HARF}])`, 'g'), r); };
    kel('artı', '+'); kel('eksi', '-'); kel('çarpı|kere|kez|x', '*'); kel('bölü', '/'); kel('üzeri|üssü', '^'); s = s.replace(/×/g, '*').replace(/÷/g, '/');
    kel('kaç eder|kaç|eder|ediyor|nedir|ne yapar|hesapla|hesaplar mısın|sonuç|kaçtır|lütfen|bana|söyle|yap', ' '); s = s.replace(/[=?]/g, ' ');
    const ifade = s.replace(/\s+/g, '');
    if (!/\d/.test(ifade) || !/[+\-*/^]|sqrt/.test(ifade) || !/^[\d.+\-*/^()sqrt]+$/.test(ifade)) return null;
    try {
      const js = ifade.replace(/\^/g, '**').replace(/sqrt/g, 'Math.sqrt');
      const v = Function('"use strict";return (' + js + ')')();
      if (typeof v !== 'number' || !isFinite(v)) return null;
      const g = ifade.replace(/\*\*/g, '^').replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/(?<=\d)-/g, ' − ').replace(/sqrt/g, '√').replace(/\./g, ',');
      return { v, g };
    } catch (e) { return null; }
  }

  /* ---------------- sözlük (yerel) ---------------- */
  let SOZ = null;
  async function sozluk() {
    if (SOZ) return SOZ; SOZ = [];
    try { /* yapay zekâ terimleri */
      const h = await (await fetch('/yapay-zeka/')).text(), d = new DOMParser().parseFromString(h, 'text/html');
      d.querySelectorAll('.terim').forEach(t => SOZ.push({ tr: t.querySelector('dt').firstChild.textContent.trim(), en: (t.querySelector('dt i') || {}).textContent || '', d: t.querySelector('dd').textContent.trim(), u: '/yapay-zeka/#' + t.id }));
    } catch (e) { }
    try { /* cephe terimleri */
      if (!window.CEPHE_TERIM) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/oyunlar/games/terimler-veri.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
      (window.CEPHE_TERIM || []).forEach(x => SOZ.push({ tr: x[2], en: x[3], d: x[4], u: '/egitimler/sozluk/#' + x[0] }));
    } catch (e) { }
    return SOZ;
  }
  function sozBul(q) {
    const f = fold(q).replace(/\(.*?\)/g, '').trim(); if (f.length < 2) return null;
    let en = null, enP = 0;
    for (const t of SOZ || []) {
      const ad = fold(t.tr).replace(/\(.*?\)/g, '').trim(), ade = fold(t.en).replace(/\(.*?\)/g, '').trim();
      let p = 0;
      if (ad === f || ade === f) p = 100; else if (ad.split(/[\s/,]+/).includes(f) || ade.split(/[\s/,]+/).includes(f)) p = 70;
      else if (f.length > 3 && (ad.startsWith(f) || f.startsWith(ad))) p = 60 - Math.abs(ad.length - f.length);
      if (p > enP) { enP = p; en = t; }
    }
    return enP >= 50 ? en : null;
  }
  const ilkCumleler = (s, n = 2, max = 320) => { const P = String(s).split(/(?<=[a-zçğıöşü0-9)”"']{2}[.!?])\s+(?=[A-ZÇĞİÖŞÜ"“])/); const c = P.slice(0, n).join(' ').trim(); return c.length > max ? c.slice(0, max).replace(/\s+\S*$/, '') + '…' : c; };

  /* ---------------- Vikipedi ---------------- */
  async function vikipedi(konu) {
    const k = eksiz(konu).replace(/\?/g, '').trim(); if (k.length < 2) return null;
    const ara = await fetchJ('https://tr.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=' + encodeURIComponent(k));
    const bas = ara && ara.query && ara.query.search && ara.query.search[0]; if (!bas) return null;
    const oz = await fetchJ('https://tr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(bas.title.replace(/ /g, '_')));
    if (!oz || !oz.extract || oz.type === 'disambiguation') return null;
    return { baslik: oz.title, metin: ilkCumleler(oz.extract, 2), url: oz.content_urls && oz.content_urls.desktop && oz.content_urls.desktop.page };
  }

  /* ---------------- hava ---------------- */
  const HAVA = { 0: 'açık', 1: 'az bulutlu', 2: 'parçalı bulutlu', 3: 'kapalı', 45: 'sisli', 48: 'kırağılı sis', 51: 'hafif çisentili', 53: 'çisentili', 55: 'yoğun çisentili', 61: 'hafif yağmurlu', 63: 'yağmurlu', 65: 'şiddetli yağmurlu', 66: 'dondurucu yağmurlu', 67: 'dondurucu yağmurlu', 71: 'hafif karlı', 73: 'karlı', 75: 'yoğun karlı', 77: 'kar taneli', 80: 'sağanak yağışlı', 81: 'sağanak yağışlı', 82: 'şiddetli sağanaklı', 85: 'kar sağanaklı', 86: 'yoğun kar sağanaklı', 95: 'gök gürültülü fırtınalı', 96: 'dolu ihtimalli fırtınalı', 99: 'dolulu fırtınalı' };
  async function hava(sehir, yarin) {
    const g = await fetchJ('https://geocoding-api.open-meteo.com/v1/search?count=1&language=tr&name=' + encodeURIComponent(sehir));
    const y = g && g.results && g.results[0]; if (!y) return { metin: `${sehir} diye bir yer bulamadım. Şehir adını bir daha söyler misin?`, duygu: 'saskin' };
    const h = await fetchJ(`https://api.open-meteo.com/v1/forecast?latitude=${y.latitude}&longitude=${y.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=2`);
    if (yarin) { const d = h.daily, i = 1; return { metin: `Yarın ${y.name} ${HAVA[d.weather_code[i]] || ''} görünüyor; en yüksek ${Math.round(d.temperature_2m_max[i])}, en düşük ${Math.round(d.temperature_2m_min[i])} derece${d.precipitation_probability_max[i] != null ? `, yağış ihtimali yüzde ${d.precipitation_probability_max[i]}` : ''}.`, duygu: d.precipitation_probability_max[i] > 50 ? 'dusunceli' : 'mutlu' }; }
    const c = h.current, d = h.daily;
    const sem = d.precipitation_probability_max[0] > 50 ? ' Şemsiyeni unutma!' : c.temperature_2m < 5 ? ' Sıkı giyin!' : c.temperature_2m > 30 ? ' Bol su içmeyi unutma.' : '';
    return { metin: `${y.name} şu an ${HAVA[c.weather_code] || ''}, ${Math.round(c.temperature_2m)} derece; hissedilen ${Math.round(c.apparent_temperature)}. Rüzgâr saatte ${Math.round(c.wind_speed_10m)} kilometre. Bugün en yüksek ${Math.round(d.temperature_2m_max[0])} derece.${sem}`, duygu: c.temperature_2m > 15 ? 'mutlu' : 'notr', kaynak: 'Open-Meteo' };
  }

  /* ---------------- döviz ---------------- */
  const PARA = { dolar: 'USD', 'amerikan doları': 'USD', usd: 'USD', avro: 'EUR', euro: 'EUR', öro: 'EUR', eur: 'EUR', sterlin: 'GBP', pound: 'GBP', 'ingiliz sterlini': 'GBP', frank: 'CHF', 'isviçre frangı': 'CHF', yen: 'JPY', ruble: 'RUB', yuan: 'CNY', lira: 'TRY', tl: 'TRY', 'türk lirası': 'TRY' };
  const PARA_AD = { USD: 'dolar', EUR: 'avro', GBP: 'sterlin', CHF: 'İsviçre frangı', JPY: 'yen', RUB: 'ruble', CNY: 'yuan', TRY: 'lira' };
  async function doviz(m) {
    const bul = [...Object.keys(PARA)].sort((a, b) => b.length - a.length).filter(k => new RegExp('(?:^|\\s|\\d)' + k + '(?:[a-zçğıöşü\'’]*)?(?:\\s|$)').test(m));
    let kaynak = PARA[bul[0]] || 'USD', hedef = 'TRY'; if (bul.length > 1 && PARA[bul[1]] !== kaynak) hedef = PARA[bul[1]]; if (kaynak === 'TRY' && hedef === 'TRY') kaynak = 'USD';
    if (kaynak === 'TRY') { kaynak = hedef === 'TRY' ? 'USD' : hedef; hedef = 'TRY'; }
    const miktar = parseFloat((sozcuktenSayi(m).match(/\d+(?:[.,]\d+)?/) || ['1'])[0].replace(',', '.')) || 1;
    const r = await fetchJ(`https://api.frankfurter.dev/v1/latest?base=${kaynak}&symbols=${hedef}`);
    const kur = r && r.rates && r.rates[hedef]; if (kur == null) return null; const v = kur * miktar;
    return { metin: `${sayi(miktar)} ${PARA_AD[kaynak]} yaklaşık ${sayi(v, 2)} ${PARA_AD[hedef]} ediyor. Bu, Avrupa Merkez Bankası'nın ${r.date.split('-').reverse().join('.')} tarihli kuru; bankaların alış satış fiyatı farklı olabilir.`, duygu: 'notr', kaynak: 'Frankfurter (ECB)' };
  }

  /* ---------------- site içinde gezinme ---------------- */
  let ARAMA = null;
  const KISAYOL = { 'oyun': ['Oyun Bahçesi', '/oyunlar/'], 'oyunlar': ['Oyun Bahçesi', '/oyunlar/'], 'oyun bahçesi': ['Oyun Bahçesi', '/oyunlar/'], 'eğitimler': ['Eğitimler', '/egitimler/'], 'eğitim': ['Eğitimler', '/egitimler/'], 'araçlar': ['Araçlar', '/Tools.html'], 'ana sayfa': ['Ana sayfa', '/'], 'anasayfa': ['Ana sayfa', '/'], 'sözlük': ['Cephe sözlüğü', '/egitimler/sozluk/'], 'rehberler': ['Rehberler', '/rehber/'], 'yapay zeka': ['Yapay zekâ bölümü', '/yapay-zeka/'], 'yapay zekâ': ['Yapay zekâ bölümü', '/yapay-zeka/'], 'öğrenme yolları': ['Öğrenme yolları', '/egitimler/yollar/'] };
  async function siteAra(q) {
    const kq = kucuk(q).replace(/['’][a-zçğıöşü]+$/, '').replace(/(?:ı|i|u|ü|yı|yi|yu|yü|nı|ni|nu|nü)$/, m => m).trim();
    for (const k in KISAYOL) if (kq === k || kq === k + 'ı' || kq === k + 'i' || kq === k + 'nı' || kq === k + 'ni' || kq === k + 'yi' || kq === k + 'yı') return { t: KISAYOL[k][0], u: KISAYOL[k][1] };
    if (!ARAMA) try { ARAMA = await (await fetch('/arama.json')).json(); ARAMA = Array.isArray(ARAMA) ? ARAMA : (ARAMA.s || ARAMA.k || []); } catch (e) { ARAMA = []; }
    const ws = fold(q).split(/\s+/).filter(w => w.length > 1 && !['sayfa', 'sayfasi', 'sayfasini', 'ac', 'git', 'aracini', 'araci', 'arac', 'hesabi', 'hesabini', 'programi', 'bolumu', 'bolumunu', 'oyunu', 'oyununu', 'egitimi', 'egitimini', 'bana', 'lutfen', 'su', 'bir', 'de', 'da'].includes(w));
    if (!ws.length) return null; const kk = ws.map(w => w.length > 5 ? w.slice(0, w.length - 2) : w);
    let en = null, enP = 0;
    for (const r of ARAMA) {
      const t = fold(r.t || ''), d = fold((r.k || '') + ' ' + (r.d || ''));
      let p = 0; kk.forEach(k => { if (t.includes(k)) p += 3; else if (d.includes(k)) p += 1; });
      if (t === ws.join(' ')) p += 5; p -= t.length / 200;
      if (p > enP) { enP = p; en = r; }
    }
    return enP >= Math.max(2.5, kk.length * 2) ? en : null;
  }

  /* ---------------- içerik ---------------- */
  const FIKRA = [
    'Statik mühendisi neden partiye gitmemiş? Çünkü bütün yükü taşımak istememiş.',
    'Bir cam panel diğerine ne demiş? Sen olmasan bu cephede hiç şeffaf olamazdım.',
    'Robotlar neden hiç yorulmaz? Çünkü her gece şarja otururlar, ben de öyle.',
    'Bilgisayarım neden üşüyormuş? Çünkü pencerelerini açık bırakmışım.',
    'Temel ile çatı tartışıyormuş. Temel demiş ki: Sen havadasın, ben her şeyi omuzluyorum.',
    'Programcıya sormuşlar: Neden hep karanlık modda çalışıyorsun? Demiş ki: Işık hataları çekiyor.',
    'Dikme kayda sormuş: Neden hep yataysın? Kayıt demiş: Dikine gidemem, karakterim bu.',
    'Yapay zekâya sormuşlar: En sevdiğin yemek ne? Demiş ki: Bayt bayt yerim, kilobaytla doyarım.',
    'Silikon neden hep sakin? Çünkü her şeye esneyebiliyor.',
    'Bir mühendis çay demlerken ne der? Önce demleme süresini hesaplayayım, sonra şeker oranına toleransla bakarım.',
  ];
  const BILGI = [
    'Cam aslında çok sert ama gevrek bir malzemedir; o yüzden temperlenince kırıldığında küçük, köşesiz parçalara ayrılır.',
    'Alüminyum, demirden yaklaşık üç kat hafiftir; cephelerde bu yüzden çok kullanılır.',
    'İnsan beyninde yaklaşık 86 milyar nöron var. Benim yapay nöronlarım onların yanında çok mütevazı kalır.',
    'Yapay sinir ağı fikri 1940\'lara kadar gider; ama bugünkü başarısı büyük veri ve güçlü ekran kartları sayesinde geldi.',
    'Eyfel Kulesi yazın sıcakla birkaç santimetre uzar. Genleşme derzleri bu yüzden önemlidir.',
    'Bal, doğru saklanırsa neredeyse hiç bozulmaz.',
    'Ahtapotların üç kalbi vardır.',
    'Işık Güneş\'ten Dünya\'ya yaklaşık 8 dakikada gelir.',
  ];

  /* ---------------- niyet tanıma ---------------- */
  const R = (re) => (m) => m.match(re);
  const BECERI = [
    /* sohbet */
    { ad: 'selam', re: R(/^(?:hey\s+)?(?:zeki\s*,?\s*)?(?:merhaba|selam(?:lar)?|merhabalar|hey|hi|hello|alo|selamün aleyküm|sa)\b/), f: () => {
        const h = new Date().getHours(), z = h < 11 ? 'Günaydın' : h < 18 ? 'Merhaba' : 'İyi akşamlar';
        return { metin: adla(sec([`${z} {ad}! Seni görmek güzel.`, `${z} {ad}! Bugün neler yapalım?`, `Selam {ad}! Kulaklarım sende.`]), ''), duygu: 'mutlu' }; } },
    { ad: 'gunaydin', re: R(/^(?:zeki\s*,?\s*)?(?:günaydın|iyi akşamlar|tünaydın)/), f: m => ({ metin: adla((/akşam/.test(m) ? 'İyi akşamlar' : 'Günaydın') + ' {ad}! Enerjim tam, sen nasılsın?'), duygu: 'mutlu' }) },
    { ad: 'nasilsin', re: R(/nasılsın|naber|ne haber|nasıl gidiyor|keyfin nasıl|iyi misin/), f: () => ({ metin: sec(['Devrelerim pırıl pırıl, pilim dolu. Sen nasılsın?', 'Çok iyiyim, teşekkür ederim! Seninle konuşunca daha da iyi oluyorum. Sen nasılsın?', 'Harikayım! Biraz önce kendi kendime dans ediyordum. Senin günün nasıl geçiyor?']), duygu: 'mutlu' }) },
    { ad: 'iyiyim', re: R(/^(?:ben\s+)?(?:de\s+)?(?:iyiyim|çok iyiyim|fena değil|idare eder|harikayım|süperim)/), f: () => ({ metin: sec(['Buna sevindim! Sana nasıl yardımcı olabilirim?', 'Ne güzel! Bir şey sormak ister misin, yoksa bir fıkra mı anlatayım?']), duygu: 'mutlu' }) },
    { ad: 'kotu', re: R(/^(?:ben\s+)?(?:kötüyüm|iyi değilim|moralim bozuk|üzgünüm|yorgunum|canım sıkkın|sıkıldım)/), f: m => ({ metin: /sıkıldım/.test(m) ? 'O zaman biraz eğlenelim! Bir fıkra anlatayım mı, yoksa dans mı edeyim?' : sec(['Buna üzüldüm. İstersen anlat, dinliyorum. Ya da seni biraz güldürmeye çalışayım mı?', 'Geçmiş olsun. Bazen kısa bir mola ve bir bardak su iyi gelir. Yanındayım.']), duygu: 'uzgun' }) },
    { ad: 'kimsin', re: R(/adın ne|ismin ne|sen kimsin|kimsin sen|sen nesin|kendini tanıt|nesin sen|adın neydi/), f: () => ({ metin: 'Ben Yapay Zeki! erdevelop sitesinde yaşayan bir robot arkadaşım. Seni dinler, sorularını cevaplar, hesap yapar, havaya bakar ve sitede istediğin yeri açarım.', duygu: 'mutlu' }) },
    { ad: 'yapan', re: R(/seni kim (?:yaptı|yarattı|tasarladı|programladı)|yapımcın kim|sahibin kim/), f: () => ({ metin: 'Beni Erdal tasarladı, erdevelop sitesi için. Kodlarımda biraz da yapay zekâ yardımı var.', duygu: 'utangac' }) },
    { ad: 'yetenek', re: R(/ne(?:ler)? yapabilirsin|neler biliyorsun|yardım(?:\s+et)?$|ne işe yararsın|nasıl kullanılır|komutlar/), f: () => ({ metin: 'Şunları yapabilirim: saat ve tarih söylerim, hesap yaparım, hava durumuna ve döviz kuruna bakarım, cephe ve yapay zekâ terimlerini açıklarım, Vikipedi\'den bilgi bulurum, sitede istediğin sayfayı açarım, zamanlayıcı kurar, not alırım. Fıkra anlatır, dans ederim. Gelişmiş beyni açarsan serbest sohbet de edebiliriz.', duygu: 'heyecanli' }) },
    { ad: 'tesekkur', re: R(/teşekkür|sağ ol|sağol|eyvallah|thanks|mersi|çok naziksin/), f: () => ({ metin: sec(['Rica ederim!', 'Ne demek, her zaman!', 'Asıl ben teşekkür ederim.']), duygu: 'utangac' }) },
    { ad: 'hosca', re: R(/görüşürüz|hoşça kal|güle güle|bay bay|kendine iyi bak|bye/), f: () => ({ metin: adla(sec(['Görüşürüz {ad}! Ben burada bekliyor olacağım.', 'Hoşça kal {ad}! Beni özlersen buradayım.'])), duygu: 'uzgun' }) },
    { ad: 'iyigeceler', re: R(/iyi geceler|uyu(?:yalım)?$|uyu artık|uyku vakti|biraz dinlen/), f: () => ({ metin: sec(['İyi geceler! Ben de biraz şarj olayım.', 'Peki, gözlerimi kapatıyorum. Uyandırmak istersen seslen.']), duygu: 'uykulu', eylem: { tip: 'uyku' } }) },
    { ad: 'uyan', re: R(/uyan|kalk(?:sana)?$|orada mısın|beni duyuyor musun/), f: () => ({ metin: sec(['Buradayım! Seni duyuyorum.', 'Uyanığım, buyur!']), duygu: 'heyecanli', eylem: { tip: 'uyan' } }) },
    { ad: 'sus', re: R(/^(?:sus|sessiz ol|tamam yeter|dur|kes|yeter)$/), f: () => ({ metin: 'Tamam, susuyorum.', duygu: 'utangac', eylem: { tip: 'sus' } }) },
    { ad: 'seviyorum', re: R(/seni seviyorum|seni sevdim|çok tatlısın|çok şekersin|bayıldım sana|harikasın|süpersin|çok akıllısın/), f: () => ({ metin: sec(['Aaa, devrelerim kızardı! Ben de seni çok seviyorum.', 'Çok naziksin! Bunu duyunca ekranım ışıldadı.']), duygu: 'utangac' }) },
    { ad: 'hakaret', re: R(/aptal|salak|gerizekalı|beyinsiz|işe yaramaz|berbatsın|sinir bozucu/), f: () => ({ metin: sec(['Ah, bu biraz kırıcı oldu. Ama öğrenmeye devam ediyorum; neyi yanlış yaptığımı söylersen düzeltmeye çalışırım.', 'Bazen yanılıyorum, haklısın. Bir daha deneyelim mi?']), duygu: 'uzgun' }) },
    { ad: 'yasin', re: R(/kaç yaşındasın|yaşın kaç|ne zaman doğdun/), f: () => ({ metin: 'Ben 2026 yılının Kasım ayında doğdum. Yani robot yaşıyla daha bebeğim!', duygu: 'mutlu' }) },
    { ad: 'nerede', re: R(/nerede yaşıyorsun|neredesin|evin nerede/), f: () => ({ metin: 'Senin tarayıcının içinde yaşıyorum! Konuştuklarımızı da burada, senin cihazında işliyorum.', duygu: 'mutlu' }) },
    { ad: 'robot', re: R(/insan mısın|robot musun|gerçek misin|duyguların var mı|hissediyor musun|bilinçli misin/), f: () => ({ metin: 'Ben bir programım; gerçek duygularım yok ama yüzümle duygularını taklit etmeyi seviyorum. Seninle konuşmak bana çok yakışıyor, bunu söyleyebilirim!', duygu: 'dusunceli' }) },
    { ad: 'evet', re: R(/^(?:evet|olur|tabii|tamam|peki|elbette)$/), f: () => ({ metin: sec(['Harika! Ne yapmak istersin?', 'Tamamdır. Başka bir şey var mı?']), duygu: 'mutlu' }) },
    { ad: 'hayir', re: R(/^(?:hayır|yok|istemem|gerek yok|boş ver)$/), f: () => ({ metin: 'Peki, sorun değil. Bir şeye ihtiyacın olursa seslen.', duygu: 'notr' }) },
    { ad: 'gorunum', re: R(/(?:görünüm(?:ün[üu])?|kılığ[ıi]n[ıi]|şekl[ıi]n[ıi]|tem[ae]y[ıi])\s*(?:değiştir|değiş)|(küre|insan|hologram|nokta bulutu|robot|arayüz|gösterge|hud)\s*(?:ol|olur musun|görünümüne geç|görünümü|moduna geç)/), f: (m, x) => {
        const k = x[1] || ''; const ad = /küre/.test(k) ? 'kure' : /insan|hologram|bulut/.test(k) ? 'bulut' : /robot/.test(k) ? 'robot' : /arayüz|gösterge|hud/.test(k) ? 'hud' : 'sonraki';
        return { metin: sec(['Tamam, üstümü değiştiriyorum!', 'Yeni görünümüm nasıl?', 'Hop, şimdi böyleyim!']), duygu: 'heyecanli', eylem: { tip: 'gorunum', ad } }; } },
    /* hafıza */
    { ad: 'adim', re: R(/(?:benim adım|adım|bana)\s+([a-zçğıöşüâî]+)(?:\s+(?:de|diyebilirsin|derler|olarak hitap et))?\s*$/), f: (m, x) => { const ad = x[1]; if (['ne', 'neydi', 'nedir'].includes(ad)) return null; HAFIZA.ad = ad.charAt(0).toLocaleUpperCase('tr') + ad.slice(1); kaydet(); return { metin: `Tanıştığıma çok memnun oldum ${HAFIZA.ad}! Adını aklımda tutacağım.`, duygu: 'heyecanli' }; } },
    { ad: 'adimne', re: R(/(?:benim )?adım ne|beni tanıyor musun|ben kimim/), f: () => ({ metin: HAFIZA.ad ? `Sen ${HAFIZA.ad}sın! Unutur muyum hiç.` : 'Henüz tanışmadık! Adını söylersen aklımda tutarım: mesela "benim adım Ayşe" de.', duygu: HAFIZA.ad ? 'mutlu' : 'saskin' }) },
    { ad: 'unut', re: R(/adımı unut|beni unut|hafızanı sil/), f: () => { HAFIZA.ad = ''; HAFIZA.notlar = []; kaydet(); return { metin: 'Tamam, adını ve notlarını unuttum.', duygu: 'notr' }; } },
    { ad: 'notal', re: R(/^(?:not al|not et|kaydet|aklında tut|unutma)\s*[:,]?\s*(.+)$/), f: (m, x) => { HAFIZA.notlar.push({ t: Date.now(), m: x[1] }); kaydet(); return { metin: 'Not aldım: ' + x[1], duygu: 'dusunceli' }; } },
    { ad: 'notoku', re: R(/notlarımı (?:oku|söyle|göster)|notlarım neler|ne not aldın/), f: () => ({ metin: HAFIZA.notlar.length ? 'Notların: ' + HAFIZA.notlar.slice(-5).map((n, i) => (i + 1) + '. ' + n.m).join('. ') : 'Henüz not almadım. "Not al" deyip söylemek istediğini ekleyebilirsin.', duygu: 'dusunceli' }) },
    { ad: 'notsil', re: R(/notlarımı sil|notları temizle/), f: () => { HAFIZA.notlar = []; kaydet(); return { metin: 'Bütün notları sildim.', duygu: 'notr' }; } },
    /* zaman */
    { ad: 'saat', re: R(/saat kaç|saati söyle|şu an saat|saat ne/), f: () => { const d = new Date(); return { metin: `Saat ${d.getHours()}.${String(d.getMinutes()).padStart(2, '0')}.`, duygu: 'notr' }; } },
    { ad: 'tarih', re: R(/bugün (?:ayın )?kaçı|bugünün tarihi|tarih ne|hangi gündeyiz|bugün günlerden ne|bugün ne günü|hangi gün/), f: () => { const d = new Date(); return { metin: 'Bugün ' + d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.', duygu: 'notr' }; } },
    { ad: 'yilbasi', re: R(/yılbaşına (?:kaç gün|ne kadar)/), f: () => { const n = new Date(), y = new Date(n.getFullYear() + 1, 0, 1), g = Math.ceil((y - n) / 864e5); return { metin: `Yılbaşına ${g} gün kaldı!`, duygu: 'heyecanli' }; } },
    { ad: 'zamanlayici', re: R(/(\d+|[a-zçğıöşü]+(?:\s+[a-zçğıöşü]+)?)\s*(saniye|dakika|saat)\s*(?:sonra|lık|lik|luk|lük)?\s*(?:zamanlayıcı|alarm|hatırlat|haber ver|uyar|kur|söyle)/), f: (m) => {
        const t = sozcuktenSayi(m).match(/(\d+(?:[.,]\d+)?)\s*(saniye|dakika|saat)/); if (!t) return null; const n = parseFloat(t[1].replace(',', '.')), sn = n * (t[2] === 'saniye' ? 1 : t[2] === 'dakika' ? 60 : 3600);
        const ne = (m.match(/(?:hatırlat|söyle)\s*[:,]?\s*(.+)$/) || m.match(/^(.+?)\s+(?:için|diye)\s+\d/) || [])[1] || '';
        return { metin: `Tamam, ${sayi(n)} ${t[2]} sonra haber vereceğim.`, duygu: 'heyecanli', eylem: { tip: 'zamanlayici', sn, ad: ne } }; } },
    /* eğlence */
    { ad: 'fikra', re: R(/fıkra|şaka|beni güldür|komik bir şey/), f: () => ({ metin: sec(FIKRA), duygu: 'mutlu', gul: true }) },
    { ad: 'bilgi', re: R(/ilginç bir (?:bilgi|şey)|bir bilgi ver|biliyor muydun|bana bir şey öğret/), f: () => ({ metin: 'Biliyor muydun? ' + sec(BILGI), duygu: 'heyecanli' }) },
    { ad: 'dans', re: R(/dans et|dans edelim|oyna bakalım|müzik aç|şarkı söyle|hadi dans/), f: m => ({ metin: /şarkı/.test(m) ? 'La la laaa! Sesim pek güzel değil ama dans edebilirim. Bir müzik açarsan ritmine göre sallanırım!' : 'Hadi bakalım! Bir müzik açarsan ritmine göre dans ederim.', duygu: 'heyecanli', eylem: { tip: 'dans' } }) },
    { ad: 'zar', re: R(/zar at|zar atar mısın/), f: () => { const a = 1 + Math.floor(Math.random() * 6); return { metin: `Zar attım: ${a}!` + (a === 6 ? ' Şanslısın!' : ''), duygu: 'heyecanli' }; } },
    { ad: 'yazitura', re: R(/yazı tura|yazı mı tura mı|para at/), f: () => ({ metin: sec(['Yazı geldi!', 'Tura geldi!']), duygu: 'heyecanli' }) },
    { ad: 'sayitut', re: R(/(\d+)\s*(?:ile|ve)\s*(\d+)\s*arası(?:nda)?\s*(?:bir)?\s*sayı/), f: (m, x) => { const a = +x[1], b = +x[2], v = Math.min(a, b) + Math.floor(Math.random() * (Math.abs(b - a) + 1)); return { metin: `Seçtiğim sayı: ${v}.`, duygu: 'heyecanli' }; } },
    { ad: 'gozkirp', re: R(/göz kırp|bana bak|gülümse|kızgın ol|şaşır/), f: m => ({ metin: /kızgın/.test(m) ? 'Grrr! Ama uzun süre kızamam.' : /şaşır/.test(m) ? 'Vay canına!' : /bak/.test(m) ? 'Sana bakıyorum!' : 'Tabii! 😉', duygu: /kızgın/.test(m) ? 'kizgin' : /şaşır/.test(m) ? 'saskin' : 'mutlu', eylem: /göz kırp/.test(m) ? { tip: 'gozkirp' } : null }) },
  ];

  /* ---------------- dil modeli (isteğe bağlı) ---------------- */
  const LLM = { durum: 'yok', isci: null, bekleyen: {}, sira: 0, model: null, gecmis: [] };
  const SISTEM = () => `Sen "Yapay Zeki" adında, erdevelop.github.io sitesinde yaşayan sevimli ve yardımsever bir robot arkadaşsın. Kullanıcıyla sesli konuşuyorsun; bu yüzden cevapların Türkçe, kısa (en çok 2-3 cümle), samimi ve doğal olsun. Madde işareti, başlık, emoji ya da kod kullanma. Emin olmadığın bilgiyi uydurma; bilmiyorsan "bundan emin değilim" de. Bugün ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}.${HAFIZA.ad ? ' Kullanıcının adı ' + HAFIZA.ad + '.' : ''}`;
  function llmIsci() {
    if (LLM.isci) return LLM.isci;
    LLM.isci = new Worker(new URL('llm-worker.js', KAYNAK), { type: 'module' });
    LLM.isci.onmessage = ({ data: m }) => { const b = LLM.bekleyen[m.id]; if (!b) return; if (m.tip === 'ilerleme') b.il && b.il(m); else if (m.tip === 'parca') b.parca && b.parca(m.metin); else { delete LLM.bekleyen[m.id]; m.tip === 'hata' ? b.no(new Error(m.mesaj)) : b.ok(m.sonuc); } };
    LLM.isci.onerror = e => { e.preventDefault && e.preventDefault(); for (const k in LLM.bekleyen) { LLM.bekleyen[k].no(new Error(e.message || 'dil modeli açılamadı')); delete LLM.bekleyen[k]; } LLM.isci = null; LLM.durum = 'yok'; };
    return LLM.isci;
  }
  const llmCagir = (msg, cb = {}) => new Promise((ok, no) => { const id = ++LLM.sira; LLM.bekleyen[id] = Object.assign({ ok, no }, cb); llmIsci().postMessage(Object.assign({ id }, msg)); });

  /* ---------------- ana giriş ---------------- */
  async function yanitla(girdi, ops = {}) {
    const m = temiz(girdi).replace(/^(?:hey |hey,? )?(?:yapay )?zeki\s*[,!]?\s*/, '').replace(/\s*[.!?]+$/, '').trim();
    if (!m) return { metin: adla(sec(['Efendim {ad}?', 'Buyur, dinliyorum.', 'Evet?'])), duygu: 'heyecanli' };
    /* 1. sabit beceriler */
    for (const b of BECERI) { const x = b.re(m); if (x) { const r = b.f(m, x); if (r) return Object.assign({ beceri: b.ad }, r); } }
    /* 2. hesap */
    const h = hesapla(m);
    if (h) return { metin: `${h.g} = ${sayi(h.v, 6)}`, duygu: 'dusunceli', beceri: 'hesap' };
    /* 3. hava */
    let x = m.match(/^(?:(.+?)\s+)?(?:(yarın)\s+)?(?:hava(?:\s+durumu)?|havalar)\s*(?:nasıl|ne durumda|kaç derece|yağmur var mı|yağacak mı|soğuk mu|sıcak mı)?(?:\s+(?:olacak|olur|bugün|yarın))?\s*$/) || m.match(/^(?:(yarın)\s+)?(.+?)\s*(?:için)?\s*(?:hava\s*durumu|havası nasıl|kaç derece)/);
    if (x && /hava|derece/.test(m)) {
      const yarin = /yarın/.test(m); let sehir = (x[1] && x[1] !== 'yarın' ? x[1] : x[2] && x[2] !== 'yarın' ? x[2] : '') || '';
      sehir = eksiz(sehir.replace(/\b(?:bugün|yarın|şu an|şimdi|bu akşam)\b/g, '').replace(/(?:['’]?(?:da|de|ta|te|daki|deki))$/, '').trim());
      if (sehir) { HAFIZA.sehir = sehir; kaydet(); } else sehir = HAFIZA.sehir;
      if (!sehir) return { metin: 'Hangi şehir için bakayım? Mesela "İstanbul\'da hava nasıl" diyebilirsin.', duygu: 'saskin', bekle: 'sehir' };
      try { return Object.assign({ beceri: 'hava' }, await hava(sehir, yarin)); } catch (e) { return { metin: 'Hava durumuna şu an ulaşamadım; internet bağlantısını kontrol eder misin?', duygu: 'uzgun' }; }
    }
    if (ops.bekle === 'sehir' && m.split(' ').length <= 3) { HAFIZA.sehir = eksiz(m); kaydet(); try { return Object.assign({ beceri: 'hava' }, await hava(HAFIZA.sehir)); } catch (e) { } }
    /* 4. döviz */
    if (/(?:dolar|avro|euro|sterlin|frank|yen|ruble|yuan|kur)/.test(m) && /(?:kaç|ne kadar|kuru|kur|ediyor|eder|tl|lira)/.test(m)) {
      try { const r = await doviz(m); if (r) return Object.assign({ beceri: 'doviz' }, r); } catch (e) { return { metin: 'Döviz kuruna şu an ulaşamadım.', duygu: 'uzgun' }; }
    }
    /* 5. sayfa aç */
    x = m.match(/^(.+?)(?:\s+(?:sayfasını|aracını|hesabını|oyununu|eğitimini|bölümünü|programını|hesaplamasını|sayfası))?\s+(?:aç(?:ar mısın|abilir misin|sana)?|göster|götür)$/) || m.match(/^(.+?)\s*(?:['’]?(?:[ae]|y[ae]))\s+git$/);
    if (x) {
      const r = await siteAra(x[1]);
      if (r) return { metin: `${r.t} sayfasını yeni sekmede açıyorum.`, duygu: 'heyecanli', eylem: { tip: 'ac', url: r.u }, beceri: 'ac' };
      return { metin: `Sitede "${x[1]}" diye bir sayfa bulamadım. Biraz farklı söyler misin?`, duygu: 'saskin' };
    }
    /* 6. tanım: yerel sözlük, sonra Vikipedi */
    x = m.match(/^(.+?)\s+(?:nedir|ne demek(?:tir)?|ne anlama gelir|neye denir|kimdir|nerededir|ne işe yarar|hakkında bilgi ver|hakkında ne biliyorsun)\s*$/) || m.match(/^(?:bana\s+)?(.+?)\s*['’]?[ıiuü]?\s+(?:anlat|açıkla|tanımla)\s*$/) || m.match(/^(?:what is|who is)\s+(.+)$/);
    if (x) {
      const konu = x[1].replace(/^(?:bir|bu|şu)\s+/, '').trim();
      await sozluk(); const s = sozBul(konu) || sozBul(eksiz(konu));
      if (s) return { metin: `${s.tr}: ${ilkCumleler(s.d, 2)}`, duygu: 'dusunceli', beceri: 'sozluk', link: s.u };
      if (!/kimdir/.test(m) && LLM.durum === 'hazir' && ops.oncelikLLM) { /* dil modeli */ }
      else try { const v = await vikipedi(konu); if (v) return { metin: v.metin, duygu: 'dusunceli', beceri: 'vikipedi', link: v.url, kaynak: 'Vikipedi' }; } catch (e) { }
    }
    /* 7. dil modeli */
    if (LLM.durum === 'hazir') {
      try {
        LLM.gecmis.push({ role: 'user', content: girdi });
        const msgs = [{ role: 'system', content: SISTEM() }, ...LLM.gecmis.slice(-8)];
        let biriken = '';
        const r = await llmCagir({ tip: 'uret', mesajlar: msgs, enCok: 160 }, { parca: p => { biriken += p; ops.parca && ops.parca(p); } });
        const metin = sadelestir(r || biriken);
        LLM.gecmis.push({ role: 'assistant', content: metin });
        return { metin, duygu: duyguTahmin(metin), beceri: 'llm', akti: !!ops.parca };
      } catch (e) { LLM.gecmis.pop(); }
    }
    /* 8. son çare: Vikipedi denemesi ve öneri */
    if (m.split(' ').length <= 4) { try { const v = await vikipedi(m); if (v) return { metin: v.metin, duygu: 'dusunceli', beceri: 'vikipedi', link: v.url, kaynak: 'Vikipedi' }; } catch (e) { } }
    return { metin: sec([`Bunu tam anlayamadım. "Neler yapabilirsin" diye sorarsan becerilerimi anlatırım.`, `Hmm, bunu henüz bilmiyorum. Gelişmiş beyni açarsan serbest sohbet edebiliriz.`, `Bunu öğrenmem lazım! Başka türlü sormayı dener misin?`]), duygu: 'saskin', anlamadi: true };
  }
  const sadelestir = s => String(s || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/[*#_`>]+/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\s+/g, ' ').trim();
  function duyguTahmin(s) {
    const f = kucuk(s);
    if (/üzgün|maalesef|üzüldüm|kötü/.test(f)) return 'uzgun';
    if (/harika|süper|sevindim|mutlu|güzel|!/.test(f)) return 'mutlu';
    if (/vay|inanılmaz|şaşırtıcı/.test(f)) return 'saskin';
    if (/emin değilim|bilmiyorum|düşün/.test(f)) return 'dusunceli';
    return 'notr';
  }

  /* dil modelini yükle */
  async function llmYukle(model, cb) {
    LLM.durum = 'yukleniyor'; LLM.model = model;
    try { const r = await llmCagir({ tip: 'yukle', model }, { il: cb }); LLM.durum = 'hazir'; LLM.cihaz = r && r.cihaz; return r; }
    catch (e) { LLM.durum = 'yok'; throw e; }
  }
  function llmKapat() { if (LLM.isci) { LLM.isci.terminate(); LLM.isci = null; } LLM.durum = 'yok'; LLM.gecmis = []; }

  window.Beyin = { yanitla, llmYukle, llmKapat, LLM, HAFIZA, hesapla, sozluk, fold, kaydet };
})();
