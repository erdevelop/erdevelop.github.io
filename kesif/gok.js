/* erdevelop · Meraklılar Köşesi gökyüzü sayfalarının ortak yardımcıları (ay, gökyüzü, ISS, burç).
   Konum seçici, saat dilimi dönüşümleri, yön adları ve Ay çizimi. Hesaplar /js/lib/astronomy.min.js ile yapılır. */
'use strict';
const GK = (() => {
  const t = (tr, en) => (window.erDil ? erDil.t(tr, en) : tr);
  const LOC = () => (window.erDil && erDil.lang === 'en' ? 'en-GB' : 'tr-TR');
  const IST = 'Europe/Istanbul';
  /* 81 il merkezi (yaklaşık koordinat) ve birkaç yurt dışı şehri: [ad, enlem, boylam, saat dilimi] */
  const IL = [['Adana', 37.00, 35.32], ['Adıyaman', 37.76, 38.28], ['Afyonkarahisar', 38.76, 30.54], ['Ağrı', 39.72, 43.05], ['Aksaray', 38.37, 34.03], ['Amasya', 40.65, 35.83], ['Ankara', 39.93, 32.86], ['Antalya', 36.89, 30.71], ['Ardahan', 41.11, 42.70], ['Artvin', 41.18, 41.82], ['Aydın', 37.85, 27.85], ['Balıkesir', 39.65, 27.88], ['Bartın', 41.63, 32.34], ['Batman', 37.88, 41.13], ['Bayburt', 40.26, 40.23], ['Bilecik', 40.14, 29.98], ['Bingöl', 38.88, 40.50], ['Bitlis', 38.40, 42.11], ['Bolu', 40.74, 31.61], ['Burdur', 37.72, 30.29], ['Bursa', 40.19, 29.06], ['Çanakkale', 40.15, 26.41], ['Çankırı', 40.60, 33.62], ['Çorum', 40.55, 34.95], ['Denizli', 37.78, 29.09], ['Diyarbakır', 37.91, 40.24], ['Düzce', 40.84, 31.16], ['Edirne', 41.68, 26.56], ['Elazığ', 38.67, 39.22], ['Erzincan', 39.75, 39.49], ['Erzurum', 39.90, 41.27], ['Eskişehir', 39.78, 30.52], ['Gaziantep', 37.07, 37.38], ['Giresun', 40.91, 38.39], ['Gümüşhane', 40.46, 39.48], ['Hakkâri', 37.58, 43.74], ['Hatay', 36.20, 36.16], ['Iğdır', 39.92, 44.05], ['Isparta', 37.76, 30.55], ['İstanbul', 41.01, 28.98], ['İzmir', 38.42, 27.14], ['Kahramanmaraş', 37.58, 36.94], ['Karabük', 41.20, 32.62], ['Karaman', 37.18, 33.22], ['Kars', 40.60, 43.10], ['Kastamonu', 41.38, 33.78], ['Kayseri', 38.73, 35.48], ['Kırıkkale', 39.85, 33.51], ['Kırklareli', 41.73, 27.22], ['Kırşehir', 39.15, 34.16], ['Kilis', 36.72, 37.12], ['Kocaeli', 40.77, 29.92], ['Konya', 37.87, 32.48], ['Kütahya', 39.42, 29.98], ['Malatya', 38.35, 38.31], ['Manisa', 38.61, 27.43], ['Mardin', 37.31, 40.74], ['Mersin', 36.81, 34.64], ['Muğla', 37.22, 28.36], ['Muş', 38.74, 41.49], ['Nevşehir', 38.62, 34.71], ['Niğde', 37.97, 34.68], ['Ordu', 40.98, 37.88], ['Osmaniye', 37.07, 36.25], ['Rize', 41.03, 40.52], ['Sakarya', 40.78, 30.40], ['Samsun', 41.29, 36.33], ['Siirt', 37.93, 41.94], ['Sinop', 42.03, 35.15], ['Sivas', 39.75, 37.02], ['Şanlıurfa', 37.16, 38.79], ['Şırnak', 37.52, 42.46], ['Tekirdağ', 40.98, 27.51], ['Tokat', 40.31, 36.55], ['Trabzon', 41.00, 39.72], ['Tunceli', 39.11, 39.55], ['Uşak', 38.68, 29.41], ['Van', 38.49, 43.38], ['Yalova', 40.66, 29.27], ['Yozgat', 39.82, 34.81], ['Zonguldak', 41.45, 31.79]];
  const DUNYA = [['Lefkoşa', 35.19, 33.36, 'Asia/Nicosia'], ['Bakü', 40.41, 49.87, 'Asia/Baku'], ['Berlin', 52.52, 13.40, 'Europe/Berlin'], ['Amsterdam', 52.37, 4.90, 'Europe/Amsterdam'], ['Brüksel', 50.85, 4.35, 'Europe/Brussels'], ['Paris', 48.86, 2.35, 'Europe/Paris'], ['Viyana', 48.21, 16.37, 'Europe/Vienna'], ['Zürih', 47.38, 8.54, 'Europe/Zurich'], ['Londra', 51.51, -0.13, 'Europe/London'], ['Stockholm', 59.33, 18.07, 'Europe/Stockholm'], ['Dubai', 25.20, 55.27, 'Asia/Dubai'], ['New York', 40.71, -74.01, 'America/New_York'], ['Toronto', 43.65, -79.38, 'America/Toronto'], ['Sidney', -33.87, 151.21, 'Australia/Sydney']];
  const KEY = 'erdevelop-gok-konum';
  const yerelTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || IST; } catch (e) { return IST; } };
  let konum = (() => { try { const k = JSON.parse(localStorage.getItem(KEY)); if (k && isFinite(k.lat) && isFinite(k.lon) && k.tz) return k; } catch (e) { } return { ad: 'İstanbul', lat: 41.01, lon: 28.98, tz: IST }; })();
  const subs = [];
  const kaydet = k => { konum = k; try { localStorage.setItem(KEY, JSON.stringify(k)); } catch (e) { } subs.forEach(f => f(k)); };

  /* bir saat dilimindeki duvar saatinin UTC'den farkı (dakika); tarayıcının saat dilimi veritabanı geçmiş yaz saatlerini de bilir */
  const fark = (ms, tz) => {
    const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).forEach(x => p[x.type] = x.value);
    return (Date.UTC(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000) / 60000;
  };
  /* yerel tarih/saat (o şehrin saatiyle) → Date */
  const yerelden = (y, mo, d, h, mi, tz) => { const g = Date.UTC(y, mo - 1, d, h, mi); let u = g - fark(g, tz) * 60000; u = g - fark(u, tz) * 60000; return new Date(u); };
  /* Date → o şehrin saatiyle parçalar */
  const parca = (dt, tz) => { const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(dt).forEach(x => p[x.type] = x.value); return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute }; };
  const saat = (dt, tz = konum.tz) => dt ? dt.toLocaleTimeString(LOC(), { timeZone: tz, hour: '2-digit', minute: '2-digit' }) : '–';
  const tarih = (dt, o = { day: 'numeric', month: 'long', weekday: 'long' }, tz = konum.tz) => dt ? dt.toLocaleDateString(LOC(), { timeZone: tz, ...o }) : '–';
  const gunSaat = (dt, tz = konum.tz) => dt ? dt.toLocaleString(LOC(), { timeZone: tz, day: 'numeric', month: 'short', weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '–';

  const YON = [['Kuzey', 'north'], ['Kuzeydoğu', 'north-east'], ['Doğu', 'east'], ['Güneydoğu', 'south-east'], ['Güney', 'south'], ['Güneybatı', 'south-west'], ['Batı', 'west'], ['Kuzeybatı', 'north-west']];
  const YK = [['K', 'N'], ['KD', 'NE'], ['D', 'E'], ['GD', 'SE'], ['G', 'S'], ['GB', 'SW'], ['B', 'W'], ['KB', 'NW']];
  const yon = az => { const i = Math.round(((az % 360) + 360) % 360 / 45) % 8; return t(YON[i][0], YON[i][1]); };
  const yonK = az => { const i = Math.round(((az % 360) + 360) % 360 / 45) % 8; return t(YK[i][0], YK[i][1]); };

  /* konum seçici: <div id="..."> içine select + "konumumu kullan" düğmesi kurar */
  function secici(el, onDegis) {
    if (typeof el === 'string') el = document.getElementById(el);
    const opt = (a, i, g) => `<option value="${g}:${i}">${a[0]}</option>`;
    el.classList.add('ctl');
    el.innerHTML = `<label class="gk-yer"><span data-en="Location">Konum</span> <select class="sel" aria-label="Şehir" data-en-aria="City"><optgroup label="${t('Türkiye', 'Turkey')}">${IL.map((a, i) => opt(a, i, 'il')).join('')}</optgroup><optgroup label="${t('Yurt dışı', 'Abroad')}">${DUNYA.map((a, i) => opt(a, i, 'du')).join('')}</optgroup><option value="ben">${t('📍 Bulunduğum yer', '📍 My location')}</option></select></label><button class="btn" type="button" data-en="📍 Use my location">📍 Konumumu kullan</button>`;
    const sel = el.querySelector('select'), btn = el.querySelector('button');
    const goster = () => { const i = IL.findIndex(a => a[0] === konum.ad), j = DUNYA.findIndex(a => a[0] === konum.ad); sel.value = i >= 0 ? 'il:' + i : j >= 0 ? 'du:' + j : 'ben'; };
    goster();
    const benim = () => {
      if (!navigator.geolocation) { TM.toast(t('Tarayıcın konum vermiyor.', 'Your browser does not share location.')); goster(); return; }
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(p => { btn.disabled = false; kaydet({ ad: t('Bulunduğun yer', 'Your location'), lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), tz: yerelTz(), ben: 1 }); goster(); },
        () => { btn.disabled = false; TM.toast(t('Konum izni verilmedi; listeden şehir seç.', 'Location permission denied; pick a city from the list.')); goster(); }, { timeout: 12000, maximumAge: 6e5 });
    };
    sel.addEventListener('change', () => { const v = sel.value; if (v === 'ben') return benim(); const [g, i] = v.split(':'), a = (g === 'il' ? IL : DUNYA)[+i]; kaydet({ ad: a[0], lat: a[1], lon: a[2], tz: a[3] || IST }); });
    btn.addEventListener('click', benim);
    if (onDegis) subs.push(onDegis);
    return { get: () => konum };
  }

  /* Ay çizimi: faz açısı (0 yeni, 90 ilk dördün, 180 dolunay, 270 son dördün), kuzey yarımküreden bakış */
  function ay(faz, r = 50, enlem = 40) {
    const f = ((faz % 360) + 360) % 360 * Math.PI / 180, rx = Math.abs(Math.cos(f)) * r, c = r + 2, top = `${c} ${c - r}`, alt = `${c} ${c + r}`;
    const buyuyen = f < Math.PI, hilal = Math.cos(f) > 0;
    let d;
    if (buyuyen) d = `M${top} A${r} ${r} 0 0 1 ${alt} A${rx} ${r} 0 0 ${hilal ? 0 : 1} ${top}Z`;
    else d = `M${top} A${r} ${r} 0 0 0 ${alt} A${rx} ${r} 0 0 ${hilal ? 1 : 0} ${top}Z`;
    const don = enlem < 0 ? ` transform="rotate(180 ${c} ${c})"` : '';
    const id = 'ay' + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 ${2 * c} ${2 * c}" aria-hidden="true"><defs><radialGradient id="${id}" cx=".4" cy=".38" r=".75"><stop offset="0" stop-color="#fffbe9"/><stop offset=".7" stop-color="#ece6cf"/><stop offset="1" stop-color="#cfc7aa"/></radialGradient></defs><circle cx="${c}" cy="${c}" r="${r}" fill="#262c3d"/><g${don}><path d="${d}" fill="url(#${id})"/></g><g fill="#000" opacity=".07"><circle cx="${c - r * .3}" cy="${c - r * .25}" r="${r * .2}"/><circle cx="${c + r * .25}" cy="${c - r * .35}" r="${r * .12}"/><circle cx="${c + r * .1}" cy="${c + r * .1}" r="${r * .16}"/><circle cx="${c - r * .05}" cy="${c + r * .45}" r="${r * .1}"/></g></svg>`;
  }
  const FAZ = [['Yeni Ay', 'New Moon'], ['Hilal (büyüyen)', 'Waxing crescent'], ['İlk Dördün', 'First quarter'], ['Şişkin Ay (büyüyen)', 'Waxing gibbous'], ['Dolunay', 'Full Moon'], ['Şişkin Ay (küçülen)', 'Waning gibbous'], ['Son Dördün', 'Last quarter'], ['Hilal (küçülen)', 'Waning crescent']];
  const fazAdi = a => { a = ((a % 360) + 360) % 360; const i = a < 6 || a >= 354 ? 0 : a < 84 ? 1 : a < 96 ? 2 : a < 174 ? 3 : a < 186 ? 4 : a < 264 ? 5 : a < 276 ? 6 : 7; return t(FAZ[i][0], FAZ[i][1]); };

  return { t, LOC, IST, IL, DUNYA, konum: () => konum, onKonum: f => subs.push(f), secici, fark, yerelden, parca, saat, tarih, gunSaat, yon, yonK, ay, fazAdi };
})();
