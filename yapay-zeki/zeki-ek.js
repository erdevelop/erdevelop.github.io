/* Yapay Zeki · ek beceriler
   Birim dönüştürme, sesle cephe hesabı, Projelerim sorgusu, sabah özeti, pomodoro, kalıcı hatırlatma,
   sesli oyunlar, dil konuşma partneri, çocuk kipi (hikâye, hayvan sesleri) ve kişilik.
   Beyin.ek listesine kaydolur; Beyin.yanitla sabit becerilerden önce bunları dener. */
(function () {
  'use strict';
  const B = window.Beyin, LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const fold = B.fold, sec = a => a[Math.floor(Math.random() * a.length)], kucuk = s => String(s || '').toLocaleLowerCase('tr');
  const sayi = (n, k = 2) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: k });
  const HARF = 'a-zçğıöşüâîû';
  const Z = () => window.Zeki;
  const gunNo = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
  const secGun = (n, L) => L[((n * 2654435761) >>> 0) % L.length];
  const ad = () => B.HAFIZA.ad;

  /* sayılar: "3,5", "üç buçuk", "eksi 20" */
  function sayilastir(s) {
    const BIR = { sıfır: 0, bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8, dokuz: 9 }, ON = { on: 10, yirmi: 20, otuz: 30, kırk: 40, elli: 50, altmış: 60, yetmiş: 70, seksen: 80, doksan: 90 };
    s = kucuk(s).replace(new RegExp(`(?<![${HARF}])((?:(?:sıfır|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|bin)(?![${HARF}])\\s*)+)`, 'g'), m => {
      let top = 0, ara = 0; for (const x of m.trim().split(/\s+/)) { if (x in BIR) ara += BIR[x]; else if (x in ON) ara += ON[x]; else if (x === 'yüz') ara = (ara || 1) * 100; else if (x === 'bin') { top += (ara || 1) * 1000; ara = 0; } }
      return (top + ara) + ' '; });
    s = s.replace(/(\d+)\s*buçuk/g, (m, a) => a + ',5').replace(/(?:eksi|minus)\s*(\d)/g, '-$1');
    s = s.replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2');
    return s;
  }
  const sayiOku = t => parseFloat(String(t).replace(',', '.'));

  /* ===================== BİRİM DÖNÜŞTÜRME ===================== */
  const G = 9.80665;
  const BIRIM = [
    ['uzunluk', 1e-3, ['milimetre', 'mm']], ['uzunluk', 1e-2, ['santimetre', 'santim', 'cm']], ['uzunluk', .1, ['desimetre', 'dm']], ['uzunluk', 1, ['metre', 'm']], ['uzunluk', 1000, ['kilometre', 'km']],
    ['uzunluk', .0254, ['inç', 'inch', 'inc', 'in', '"']], ['uzunluk', .3048, ['feet', 'fit', 'ayak', 'ft']], ['uzunluk', .9144, ['yarda', 'yard']], ['uzunluk', 1609.344, ['mil', 'mile']], ['uzunluk', 1852, ['deniz mili']],
    ['alan', 1e-6, ['milimetrekare', 'mm²', 'mm2']], ['alan', 1e-4, ['santimetrekare', 'cm²', 'cm2']], ['alan', 1, ['metrekare', 'm²', 'm2']], ['alan', 1000, ['dönüm']], ['alan', 1e4, ['hektar']], ['alan', .09290304, ['feet kare', 'fit kare', 'ft²', 'ft2']], ['alan', 1e6, ['kilometrekare', 'km²']],
    ['hacim', 1e-6, ['mililitre', 'ml']], ['hacim', 1e-3, ['litre', 'lt']], ['hacim', 1, ['metreküp', 'm³', 'm3']], ['hacim', .00378541, ['galon']],
    ['kutle', 1e-3, ['gram', 'gr', 'g']], ['kutle', 1, ['kilogram', 'kilo', 'kg']], ['kutle', 1000, ['ton']], ['kutle', .45359237, ['pound', 'libre', 'lb']], ['kutle', .0283495, ['ons', 'ounce', 'oz']],
    ['kuvvet', 1, ['newton', 'n']], ['kuvvet', 1000, ['kilonewton', 'kn']], ['kuvvet', 1e6, ['meganewton', 'mn']], ['kuvvet', G, ['kilogram kuvvet', 'kgf']], ['kuvvet', G * 1000, ['ton kuvvet', 'tf']], ['kuvvet', 4.4482216, ['pound kuvvet', 'lbf']],
    ['basinc', 1, ['pascal', 'pa']], ['basinc', 1000, ['kilopascal', 'kpa', 'kilonewton metrekare', 'kn/m²', 'kn/m2']], ['basinc', 1e6, ['megapascal', 'mpa', 'newton milimetrekare', 'n/mm²', 'n/mm2']], ['basinc', 1e5, ['bar']], ['basinc', 100, ['milibar', 'mbar', 'hektopascal', 'hpa']], ['basinc', 6894.757, ['psi']], ['basinc', G, ['kilogram metrekare', 'kg/m²', 'kg/m2']], ['basinc', 101325, ['atmosfer', 'atm']],
    ['hiz', 1, ['metre saniye', 'm/s']], ['hiz', 1 / 3.6, ['kilometre saat', 'km/sa', 'km/h']], ['hiz', .44704, ['mil saat', 'mph']], ['hiz', .514444, ['knot', 'deniz mili saat']],
    ['enerji', 1, ['joule', 'jul', 'j']], ['enerji', 1000, ['kilojoule', 'kj']], ['enerji', 4184, ['kilokalori', 'kcal']], ['enerji', 3.6e6, ['kilovatsaat', 'kwh']],
    ['guc', 1, ['watt', 'vat', 'w']], ['guc', 1000, ['kilowatt', 'kilovat', 'kw']], ['guc', 745.7, ['beygir', 'hp']],
    ['aci', 1, ['derece açı']], ['aci', 180 / Math.PI, ['radyan', 'rad']],
    ['sicaklik', 'C', ['santigrat', 'celsius', 'derece', '°c']], ['sicaklik', 'F', ['fahrenhayt', 'fahrenheit', '°f']], ['sicaklik', 'K', ['kelvin']],
  ];
  const BIRIM_AD = { uzunluk: 'uzunluk', alan: 'alan', hacim: 'hacim', kutle: 'kütle', kuvvet: 'kuvvet', basinc: 'basınç', hiz: 'hız', enerji: 'enerji', guc: 'güç', aci: 'açı', sicaklik: 'sıcaklık' };
  const ALIAS = BIRIM.flatMap(b => b[2].map(a => [a, b])).sort((a, b) => b[0].length - a[0].length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\/"²³]/g, c => c === '²' || c === '³' ? c : '\\' + c);
  const EKLER = `(?:['’][${HARF}]+|ye|ya|yi|yı|yu|yü|e|a|i|ı|u|ü|de|da|te|ta|den|dan|ten|tan|nin|nın|nun|nün|in|ın|un|ün)?`;
  const BIRIM_RE = '(' + ALIAS.map(a => esc(a[0])).join('|') + ')' + EKLER + `(?![${HARF}0-9])`;
  const birimBul = s => { s = s.replace(/[.,]$/, ''); const a = ALIAS.find(x => x[0] === s); return a ? a[1] : null; };
  function cevir(m) {
    const s = sayilastir(m).replace(/\s+/g, ' ');
    const re = new RegExp(`(-?\\d+(?:[.,]\\d+)?)\\s*${BIRIM_RE}\\s*(?:kaç|ne kadar|ne eder|=|to|in)?\\s*${BIRIM_RE}`, 'i');
    const x = s.match(re); if (!x) return null;
    const v = sayiOku(x[1]), a = birimBul(x[2]), b = birimBul(x[3]); if (!a || !b || isNaN(v)) return null;
    let sonuc, not = '';
    if (a[0] === 'sicaklik' && b[0] === 'sicaklik') { const c = a[1] === 'C' ? v : a[1] === 'F' ? (v - 32) * 5 / 9 : v - 273.15; sonuc = b[1] === 'C' ? c : b[1] === 'F' ? c * 9 / 5 + 32 : c + 273.15; }
    else if (a[0] === b[0]) sonuc = v * a[1] / b[1];
    else if (a[0] === 'kutle' && b[0] === 'kuvvet') { sonuc = v * a[1] * G / b[1]; not = ' Kütleyi yerçekimi ivmesiyle (9,81 m/s²) çarparak kuvvete çevirdim.'; }
    else if (a[0] === 'kuvvet' && b[0] === 'kutle') { sonuc = v * a[1] / G / b[1]; not = ' Kuvveti yerçekimi ivmesine bölerek kütleye çevirdim.'; }
    else return { metin: `${BIRIM_AD[a[0]]} ile ${BIRIM_AD[b[0]]} birbirine çevrilemez.`, duygu: 'saskin' };
    const k = Math.abs(sonuc) >= 100 ? 2 : Math.abs(sonuc) >= 1 ? 3 : 6;
    return { metin: `${sayi(v, 6)} ${x[2]} = ${sayi(sonuc, k)} ${x[3]}.${not}`, duygu: 'dusunceli', beceri: 'birim', kart: { tip: 'basit', baslik: 'Birim dönüştürme', satirlar: [[sayi(v, 6) + ' ' + x[2], sayi(sonuc, k) + ' ' + x[3]]] } };
  }

  /* ===================== SESLE CEPHE HESABI ===================== */
  /* metindeki sayıları birimleriyle çıkar */
  function olcuculer(m) {
    const s = sayilastir(m), out = [];
    const re = /(-?\d+(?:[.,]\d+)?)\s*(milimetre|mm|santimetre|santim|cm|metre|m|kilonewton(?:\s*(?:bölü|\/)?\s*metrekare)?|kn(?:\s*\/?\s*m²|\s*\/\s*m2)?|kilopascal|kpa|derece|°c|°|metre\s*bölü\s*saniye|m\/s|w\/m²k|watt)?(?![a-zçğıöşü])/gi;
    let x; while ((x = re.exec(s))) { const v = sayiOku(x[1]); if (isNaN(v)) continue; out.push({ v, b: (x[2] || '').replace(/\s+/g, ''), i: x.index, on: s.slice(Math.max(0, x.index - 28), x.index), son: s.slice(x.index + x[0].length, x.index + x[0].length + 24) }); }
    return out;
  }
  const mm = o => /^(milimetre|mm)$/.test(o.b) ? o.v : /^(santimetre|santim|cm)$/.test(o.b) ? o.v * 10 : /^(metre|m)$/.test(o.b) ? o.v * 1000 : o.v < 50 ? o.v * 1000 : o.v;
  const uz = o => /^(milimetre|mm|santimetre|santim|cm|metre|m)$/.test(o.b) || (!o.b && o.v >= 300 && o.v <= 30000);
  const yuk = o => /^(kilonewton|kn|kilopascal|kpa)/.test(o.b);
  const yakin = (L, re) => L.find(o => re.test(o.on) || re.test(o.son));
  const HESAP = [
    { ad: 'ucw', adi: 'Ucw hesabı', re: /ucw|u değeri|ısı geçirgenli/, u: '/kesif/ucw.html', p(L) {
        const q = {}, U = L.filter(uz); if (U[0]) q.w = Math.round(mm(U[0])); if (U[1]) q.h = Math.round(mm(U[1]));
        const K = L.filter(o => o.v < 10 && !uz(o)), ug = K.find(o => /cam|ug/.test(o.on.slice(-12))), uf = K.find(o => /çerçeve|profil|uf/.test(o.on.slice(-12))); if (ug) q.ug = ug.v; if (uf) q.uf = uf.v; return q; } },
    { ad: 'sehim', adi: 'Dikme sehim hesabı', re: /sehim|dikme/, u: '/kesif/sehim.html', p(L) {
        const q = {}, U = L.filter(uz), Y = L.filter(yuk);
        const aks = U.find(o => /aks|genişli|modül|aralı/.test(o.on.slice(-16))); const boy = U.find(o => o !== aks && /dikme|boy|açıklık|yükseklik|kat/.test(o.on.slice(-16) + o.son.slice(0, 12))) || U.find(o => o !== aks);
        if (boy) q.L = Math.round(mm(boy)); if (aks) q.b = Math.round(mm(aks)); if (Y[0]) q.w = Y[0].v;
        const I = yakin(L.filter(o => !o.b), /atalet|ix|i değeri/); if (I) q.I = I.v; return q; } },
    { ad: 'kar', adi: 'Kar yükü hesabı', re: /kar yük|kar hesab/, u: '/kesif/kar.html', p(L, m) {
        const q = {}, r = yakin(L, /rakım|yükseklik|kot/) || L.find(o => /^(metre|m)$/.test(o.b)); if (r) q.alt = r.v;
        const e = yakin(L, /eğim/) || L.find(o => /derece|°/.test(o.b)); if (e) q.slope = e.v;
        const b = m.match(/(\d|i{1,3}v?|iv)\.?\s*(?:inci|ıncı|üncü|nci|ncı|ncü)?\s*(?:kar\s*)?bölge/); if (b) { const n = { i: 1, ii: 2, iii: 3, iv: 4 }[b[1]] || +b[1]; if (n >= 1 && n <= 4) q.zone = String(n - 1); } return q; } },
    { ad: 'genlesme', adi: 'Isıl genleşme hesabı', re: /genleşme|genleşmesi|uzama/, u: '/kesif/genlesme.html', p(L, m) {
        const q = {}, U = L.filter(uz); if (U[0]) q.L = Math.round(mm(U[0]));
        const tt = L.filter(o => !uz(o) && !yuk(o)), T = tt.filter(o => /derece|°|°c/.test(o.b) || /^\s*(?:ile|ve|-|–)/.test(o.son)).map(o => o.v);
        const ts = (T.length >= 2 ? T : tt.map(o => o.v)).slice(0, 2); if (ts.length === 2) { q.tmin = Math.min(...ts); q.tmax = Math.max(...ts); }
        const M = [['alüminyum', 'al'], ['paslanmaz', 'ss'], ['çelik', 'st'], ['cam', 'gl'], ['kompozit', 'acp'], ['bakır', 'cu'], ['çinko', 'zn'], ['pvc', 'pvc'], ['grc', 'gfrc'], ['beton', 'gfrc'], ['granit', 'stn'], ['taş', 'stn'], ['seramik', 'cer'], ['ahşap', 'wd']].find(x => m.includes(x[0]));
        if (M) q.mat = M[1]; return q; } },
    { ad: 'ruzgar', adi: 'Rüzgâr yükü hesabı', re: /rüzgar yük|rüzgâr yük|rüzgar basın|rüzgâr basın|rüzgar hesab|rüzgâr hesab/, u: '/kesif/ruzgar.html', p(L, m) {
        const q = {}, h = yakin(L, /yükseklik|bina|kat|yüksek/) || L.find(o => /^(metre|m)$/.test(o.b)); if (h) q.h = h.v;
        const v = yakin(L, /hız|temel/) || L.find(o => /m\/s|saniye/.test(o.b)); if (v && v !== h) q.vb0 = v.v;
        const k = m.match(/(\d|iv|iii|ii|i|0)\s*\.?\s*(?:arazi\s*)?kategori|kategori\s*(\d)/); if (k) { const n = { 0: 0, i: 1, ii: 2, iii: 3, iv: 4 }[k[1]] ?? +(k[1] || k[2]); if (n >= 0 && n <= 4) q.cat = n; } return q; } },
    { ad: 'cam', adi: 'Cam kalınlığı hesabı', re: /cam(?! yünü)/, u: '/kesif/cam.html', p(L) {
        const q = {}, U = L.filter(uz), Y = L.filter(yuk); if (U[0]) q.a = Math.round(mm(U[0])); if (U[1]) q.b = Math.round(mm(U[1])); if (Y[0]) q.q = Y[0].v; return q; } },
  ];
  const ARIA = { L: 'boy', b: 'aks', w: 'rüzgâr', I: 'atalet', a: 'genişlik', q: 'yük', alt: 'rakım', slope: 'eğim', zone: 'bölge', tmin: 'en düşük sıcaklık', tmax: 'en yüksek sıcaklık', mat: 'malzeme', ug: 'Ug', uf: 'Uf', h: 'yükseklik', vb0: 'temel rüzgâr hızı', cat: 'arazi kategorisi' };
  function hesapCalistir(url) {
    return new Promise((ok, no) => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-3000px;top:0;width:1100px;height:900px;opacity:0;pointer-events:none'; f.src = url; let bitti = false;
      const temizle = () => { bitti = true; setTimeout(() => f.remove(), 50); };
      const sure = setTimeout(() => { if (!bitti) { temizle(); no(new Error('Hesap sayfası zamanında açılmadı')); } }, 12000);
      f.onload = () => {
        let deneme = 0; const bak = () => {
          if (bitti) return; let d; try { d = f.contentDocument; } catch (e) { clearTimeout(sure); temizle(); return no(e); }
          const big = [...d.querySelectorAll('.res .big')].filter(e => e.innerText.trim()), vd = d.querySelector('#vd, .verdict');
          if ((big.length || vd) && deneme > 2) { const r = { big: big.slice(0, 3).map(e => e.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean)), vd: vd ? vd.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean) : null }; clearTimeout(sure); temizle(); return ok(r); }
          if (++deneme > 40) { clearTimeout(sure); temizle(); return no(new Error('Sonuç okunamadı')); } setTimeout(bak, 150);
        }; bak();
      };
      document.body.appendChild(f);
    });
  }
  const seslendir = s => s.replace(/kN\/m²/g, 'kilonewton bölü metrekare').replace(/W\/m²K/g, 'vat bölü metrekare kelvin').replace(/\bmm\b/g, 'milimetre').replace(/\bMPa\b/g, 'megapaskal').replace(/cm⁴/g, 'santimetre üzeri dört').replace(/cm³/g, 'santimetre küp').replace(/%(\d+)/g, 'yüzde $1').replace(/·/g, ',').replace(/≤/g, 'en fazla');
  async function sesliHesap(m) {
    if (!/hesapla|hesabı|hesap yap|kontrol et|ne olur|kaç olur|nedir|bul|yap|çıkar/.test(m)) return null;
    const H = HESAP.find(h => h.re.test(m)); if (!H) return null;
    const L = olcuculer(m); if (!L.length && !/hesapla|hesap yap|hesabı yap|hesabını yap/.test(m)) return null; if (!L.length) return { metin: `${H.adi} için değer söylemedin. Örneğin: "${H.ad === 'sehim' ? '3,5 metre dikme, aks 1,5 metre, rüzgâr 1,2 kilonewton, sehim hesapla' : H.ad === 'cam' ? '1500\'e 2500 cam, 1,2 kilonewton yük, cam hesapla' : H.ad === 'kar' ? '800 metre rakım, 3. bölge, kar yükü hesapla' : H.ad === 'genlesme' ? '6 metre alüminyum, eksi 20 ile 80 derece, genleşme hesapla' : H.ad === 'ucw' ? '1500\'e 3600 modül, cam 1,1, Ucw hesapla' : '30 metre bina, rüzgâr yükü hesapla'}".`, duygu: 'dusunceli' };
    const q = H.p(L, m); const yol = H.u + '?' + new URLSearchParams(q).toString();
    let r; try { r = await hesapCalistir(yol); } catch (e) { return { metin: `Hesabı çalıştıramadım: ${e.message}. Sayfayı açıp kendin bakabilirsin.`, duygu: 'uzgun', link: yol, kaynak: 'Hesabı aç' }; }
    const BRM = { w: H.ad === 'ucw' ? '' : ' kN/m²', q: ' kN/m²', alt: ' m', slope: '°', tmin: ' °C', tmax: ' °C', h: H.ad === 'ucw' ? '' : ' m', vb0: ' m/s', ug: ' W/m²K', uf: ' W/m²K', I: ' cm⁴' };
    const AD2 = Object.assign({}, ARIA, H.ad === 'ucw' ? { w: 'genişlik', h: 'yükseklik' } : H.ad === 'cam' ? { a: 'genişlik', b: 'yükseklik' } : {});
    const girdi = Object.entries(q).map(([k, v]) => `${AD2[k] || k} ${typeof v !== 'number' ? (k === 'zone' ? (+v + 1) + '.' : v) : ['L', 'b', 'a'].includes(k) || (k === 'w' || k === 'h') && H.ad === 'ucw' ? sayi(v / 1000, 3) + ' m' : sayi(v) + (BRM[k] || '')}`).join(', ');
    let metin;
    if (r.vd) metin = r.vd[0] + (r.vd[1] ? ' ' + r.vd[1] : '') + '.';
    else metin = r.big.slice(0, 2).map(x => `${kucuk(x[0]).replace(/^./, c => c.toLocaleUpperCase('tr'))} ${x[1] || ''}${x[2] ? ', ' + x[2] : ''}`).join('. ') + '.';
    const satirlar = r.vd ? [[r.vd[0], r.vd.slice(1).join(' ')]] : r.big.map(x => [x[0], (x[1] || '') + (x[2] ? ' · ' + x[2] : '')]);
    return { metin: seslendir(`${H.adi}: ${metin}`) + ' Ayrıntılar için hesabı açabilirsin.', ekran: `${H.adi} (${girdi}): ${metin}`, duygu: 'dusunceli', beceri: 'hesap', link: yol, kaynak: 'Hesabı aç',
      kart: { tip: 'hesap', baslik: H.adi, alt: girdi + (Object.keys(q).length ? '' : 'varsayılan değerler'), satirlar, link: yol } };
  }

  /* ===================== PROJELERİM ===================== */
  function projeSorgu(m) {
    if (!/proje(?:ler)?(?:im|imde|imden|lerim|lerimde|mde|min)|projesi(?:nin|nde|ndeki)?\b|kayıtlı hesap|kaydettiğim hesap/.test(m)) return null;
    let P = {}; try { P = (JSON.parse(LS.get('erdevelop-projeler') || '{}') || {}).p || {}; } catch (e) { }
    const adlar = Object.keys(P);
    if (!adlar.length) return { metin: 'Bu tarayıcıda kayıtlı proje yok. Hesap sayfalarının altındaki "Projeye kaydet" düğmesiyle hesaplarını bir projede toplayabilirsin.', duygu: 'dusunceli', link: '/hesapla/projelerim.html', kaynak: 'Projelerim' };
    const f = fold(m), bul = adlar.find(a => f.includes(fold(a))) || adlar.find(a => fold(a).split(/\s+/).filter(w => w.length > 2).some(w => f.includes(w)));
    const tarih = t => t ? new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';
    if (bul) {
      const h = (P[bul].h || []).slice().sort((a, b) => (b.t || 0) - (a.t || 0));
      if (!h.length) return { metin: `${bul} projesinde henüz kayıtlı hesap yok.`, duygu: 'dusunceli' };
      const s = h[0];
      return { metin: `${bul} projesinin son hesabı: ${s.b}, ${tarih(s.t)}. ${s.z ? 'Sonuç: ' + s.z + '.' : ''}${s.n ? ' Notun: ' + s.n + '.' : ''} Projede toplam ${h.length} hesap var.`, duygu: 'dusunceli', beceri: 'proje', link: s.u, kaynak: 'Hesabı aç',
        kart: { tip: 'liste', baslik: bul, alt: h.length + ' hesap', satirlar: h.slice(0, 6).map(x => [x.b, (x.z || '') + ' · ' + tarih(x.t), x.u]) } };
    }
    return { metin: `${adlar.length} projen var: ${adlar.slice(0, 6).join(', ')}. Hangisini merak ediyorsun? Mesela "${adlar[0]} projesinin son hesabı" diyebilirsin.`, duygu: 'dusunceli', beceri: 'proje', link: '/hesapla/projelerim.html', kaynak: 'Projelerim',
      kart: { tip: 'liste', baslik: 'Projelerim', satirlar: adlar.slice(0, 8).map(a => [a, (P[a].h || []).length + ' hesap · ' + tarih(P[a].t), '/hesapla/projelerim.html']) } };
  }

  /* ===================== SABAH ÖZETİ ===================== */
  let YD = null;
  async function ydYukle() {
    if (YD) return YD;
    try { const t = await (await fetch('/oyunlar/games/gunluk-kelime.js')).text(); const a = t.indexOf('const YD = ') + 11, b = t.indexOf(';\n', a); YD = JSON.parse(t.slice(a, b)); } catch (e) { YD = {}; }
    return YD;
  }
  const seriOku = id => { try { const N = gunNo(), g = ((JSON.parse(localStorage.getItem('ob_seri_v1') || '{}')[id]) || {}).g || {}; let s = 0, k = g[N] ? N : N - 1; while (g[k] && g[k].ok) { s++; k--; } return { s, bugun: !!g[N] }; } catch (e) { return { s: 0, bugun: false }; } };
  async function sabahOzeti() {
    const d = new Date(), h = d.getHours(), N = gunNo(), parca = [], kart = [];
    parca.push({ m: `${h < 11 ? 'Günaydın' : h < 18 ? 'Merhaba' : 'İyi akşamlar'}${ad() ? ' ' + ad() : ''}! Bugün ${d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}.` });
    const isler = [];
    if (B.HAFIZA.sehir) isler.push(B.hava(B.HAFIZA.sehir).then(r => { parca.push({ m: r.metin }); kart.push(['🌤 Hava', r.metin]); }).catch(() => { }));
    isler.push(fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=TRY,USD').then(r => r.json()).then(j => { const usd = j.rates.TRY / j.rates.USD, eur = j.rates.TRY; parca.push({ m: `Dolar ${sayi(usd)}, avro ${sayi(eur)} lira.` }); kart.push(['💱 Döviz', `USD ${sayi(usd)} · EUR ${sayi(eur)} ₺`]); }).catch(() => { }));
    await Promise.all(isler);
    await ydYukle(); const en = YD.en ? Object.keys(YD.en) : [];
    if (en.length) { const k = secGun(N, en), w = YD.en[k]; parca.push({ m: 'Günün İngilizce kelimesi:' }, { m: w[0], dil: 'en-US' }, { m: `, yani ${w[1]}.` }); kart.push(['🇬🇧 Günün kelimesi', `${w[0]} — ${w[1]}`]); }
    await B.sozluk(); const T = window.CEPHE_TERIM || [];
    if (T.length) { const x = secGun(N, T); parca.push({ m: `Günün cephe terimi ${x[2]}: ${String(x[4]).split(/(?<=[.;])\s/)[0]}` }); kart.push(['🏢 Günün cephe terimi', `${x[2]} · ${x[3]}`]); }
    const s1 = seriOku('gunlukkelime'), s2 = seriOku('cepheterim'), en1 = Math.max(s1.s, s2.s);
    if (en1 > 0) { parca.push({ m: `Bulmaca serin ${en1} gün. ${s1.bugun && s2.bugun ? 'Bugünkü bulmacaları da çözmüşsün, harika!' : 'Bugünkü bulmacayı çözersen seri devam eder.'}` }); kart.push(['🔥 Seri', en1 + ' gün' + (s1.bugun ? ' · bugün çözüldü' : '')]); }
    else parca.push({ m: 'Bugünün bulmacaları da hazır; istersen oyunları açayım.' });
    if (!B.HAFIZA.sehir) parca.push({ m: 'Hava durumunu da söylememi istersen bir kez "İstanbul\'da hava nasıl" diye sor, şehrini hatırlarım.' });
    LS.set('zeki:ozetGun', String(N));
    return { parcalar: parca, metin: parca.map(p => p.m).join(' ').replace(/\s+([,.])/g, '$1'), duygu: 'mutlu', beceri: 'ozet', kart: { tip: 'liste', baslik: 'Günün özeti', satirlar: kart.map(([a, b]) => [a, b]) }, link: '/oyunlar/', kaynak: 'Bulmacalar' };
  }

  /* ===================== POMODORO ===================== */
  const POM = { acik: false, tur: 0, calis: 25, mola: 5 };
  function pomodoroBaslat(dk) {
    POM.acik = true; POM.calis = dk || POM.calis; POM.tur++;
    Z().zamanlayici(POM.calis * 60, `🍅 Çalışma ${POM.tur}`, () => {
      if (!POM.acik) return; const uzun = POM.tur % 4 === 0, md = uzun ? 15 : POM.mola;
      Z().konus(`${POM.tur}. çalışma turu bitti, harika iş! Şimdi ${md} dakika mola: kalk, biraz su iç, gözlerini ekrandan ayır.`, 'mutlu');
      Z().efekt && Z().efekt('bitti');
      Z().zamanlayici(md * 60, '☕ Mola', () => { if (!POM.acik) return; Z().konus('Mola bitti. Yeni çalışma turuna başlıyorum; hazır mısın?', 'heyecanli'); pomodoroBaslat(); }, 'mola');
    }, 'pomodoro');
  }
  function pomodoro(m) {
    if (/(pomodoro|çalışma|odak)\w*\s*(?:bitir|durdur|kapat|iptal)|pomodoroyu bitir/.test(m)) { if (!POM.acik) return { metin: 'Şu an açık bir pomodoro yok.', duygu: 'notr' }; POM.acik = false; Z().zamanlayiciSil('pomodoro'); Z().zamanlayiciSil('mola'); const t = POM.tur; POM.tur = 0; return { metin: `Pomodoroyu bitirdim. Bugün ${t} çalışma turu tamamladın.`, duygu: 'mutlu' }; }
    const x = m.match(/(\d+)?\s*(?:dakika)?\s*(?:çalışalım|odaklanalım|ders çalışalım|pomodoro)|pomodoro (?:başlat|kur|aç)|odaklanma (?:modu|zamanı)/);
    if (!x || /hatırlat|ingilizce|fransızca|almanca/.test(m)) return null;
    const sm = sayilastir(m).match(/(\d+)\s*dakika/); const dk = sm ? Math.min(120, Math.max(1, +sm[1])) : 25;
    POM.tur = 0; pomodoroBaslat(dk);
    return { metin: `Tamam, ${dk} dakika çalışalım. Süre dolunca sana mola vereceğim. Bitirmek istersen "pomodoroyu bitir" de.`, duygu: 'heyecanli', beceri: 'pomodoro' };
  }

  /* ===================== KALICI HATIRLATMA ===================== */
  const FB = { apiKey: 'AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU', authDomain: 'oyun-bahcesi-62633.firebaseapp.com', projectId: 'oyun-bahcesi-62633', storageBucket: 'oyun-bahcesi-62633.firebasestorage.app', messagingSenderId: '591926138614', appId: '1:591926138614:web:24101e1be195ebc04c3ed7' };
  const PUSH_PUB = 'BGPY6KZFQc8GQbAQQiw-0CBI8X6mrn9VHS7yC8fU8Lbw3Ep5H1OyBLXl6ADn_vGn2fp6F64JL1cMdIFhooZM_BQ';
  let fbHazir = null;
  function fbYukle() {
    if (fbHazir) return fbHazir;
    fbHazir = (async () => {
      for (const n of ['firebase-app-compat', 'firebase-auth-compat', 'firebase-firestore-compat']) await new Promise((ok, no) => { if (window.firebase && (n === 'firebase-app-compat' || (n.includes('auth') ? firebase.auth : firebase.firestore))) return ok(); const s = document.createElement('script'); s.src = `https://www.gstatic.com/firebasejs/10.12.2/${n}.js`; s.onload = ok; s.onerror = () => no(new Error('bağlantı')); document.head.appendChild(s); });
      if (!firebase.apps.length) firebase.initializeApp(window.ZEKI_FB || FB);
      const u = await new Promise(ok => { const off = firebase.auth().onAuthStateChanged(x => { off(); ok(x); }); });
      return u;
    })().catch(e => { fbHazir = null; throw e; });
    return fbHazir;
  }
  function zamanCoz(m) {
    const s = sayilastir(m), simdi = new Date();
    let x = s.match(/(\d+(?:[.,]\d+)?)\s*(dakika|saat|gün)\s*sonra/);
    if (x) { const n = sayiOku(x[1]), ms = n * (x[2] === 'dakika' ? 6e4 : x[2] === 'saat' ? 36e5 : 864e5); return new Date(simdi.getTime() + ms); }
    x = s.match(/(?:(bugün|yarın|öbür gün|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)\s*)?(?:(sabah|öğle(?:den sonra)?|akşam|gece)\s*)?saat\s*(\d{1,2})(?:[.:\s](\d{2}))?|(?:(bugün|yarın|öbür gün)\s*)?(sabah|öğleden sonra|akşam)\s*(\d{1,2})(?:[.:](\d{2}))?['’]?[dt][ae]/);
    if (!x) return null;
    const gun = x[1] || x[5], dil = x[2] || x[6]; let sa = +(x[3] || x[7]), dk = +(x[4] || x[8] || 0);
    if (/akşam|gece|öğleden sonra/.test(dil || '') && sa < 12) sa += 12;
    const t = new Date(simdi); t.setSeconds(0, 0); t.setHours(sa, dk);
    const GUNLER = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
    if (gun === 'yarın') t.setDate(t.getDate() + 1); else if (gun === 'öbür gün') t.setDate(t.getDate() + 2);
    else if (GUNLER.includes(gun)) { let f = (GUNLER.indexOf(gun) - t.getDay() + 7) % 7; if (f === 0 && t <= simdi) f = 7; t.setDate(t.getDate() + f); }
    else if (t <= simdi) { if (!dil && sa < 12 && sa + 12 > simdi.getHours()) t.setHours(sa + 12); if (t <= simdi) t.setDate(t.getDate() + 1); }
    return t;
  }
  const hatirlatmalar = () => { try { return JSON.parse(LS.get('zeki:hatirlat') || '[]').filter(h => h.z > Date.now() - 6e4); } catch (e) { return []; } };
  async function buluta(liste) {
    const u = await fbYukle(); if (!u) throw new Error('GIRIS');
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) throw new Error('PUSH_YOK');
    if (Notification.permission !== 'granted' && (await Notification.requestPermission()) !== 'granted') throw new Error('IZIN');
    const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription(); if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(PUSH_PUB.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)) });
    const j = sub.toJSON();
    await firebase.firestore().collection('push').doc(u.uid + '_zeki').set({ on: liste.length > 0, page: 'zeki', sub: { endpoint: j.endpoint, keys: j.keys }, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, hj: JSON.stringify(liste.map(h => ({ z: h.z, m: h.m.slice(0, 140) }))), err: '', upd: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  async function hatirlat(m) {
    if (/hatırlatmalarım|hatırlatmaları (?:oku|söyle|göster)|neyi hatırlatacaksın/.test(m)) {
      const L = hatirlatmalar(); if (!L.length) return { metin: 'Kurulu hatırlatman yok.', duygu: 'notr' };
      return { metin: L.length + ' hatırlatman var: ' + L.slice(0, 5).map(h => new Date(h.z).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) + ', ' + h.m).join('; ') + '.', duygu: 'dusunceli',
        kart: { tip: 'liste', baslik: 'Hatırlatmalar', satirlar: L.map(h => [new Date(h.z).toLocaleString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), h.m + (h.b ? ' · 📱' : '')]) } };
    }
    if (/hatırlatmaları (?:sil|temizle|iptal)/.test(m)) { LS.set('zeki:hatirlat', '[]'); try { if (window.firebase && firebase.auth && firebase.auth().currentUser) await buluta([]); } catch (e) { } return { metin: 'Bütün hatırlatmaları sildim.', duygu: 'notr' }; }
    if (!/hatırlat|haber ver|uyar|bildirim gönder/.test(m)) return null;
    const t = zamanCoz(m); if (!t) return null;
    const kisaSure = t - Date.now() < 30 * 6e4 && !/telefon|bildirim/.test(m);
    if (kisaSure && /(\d+|[a-zçğıöşü]+)\s*(saniye|dakika)\s*sonra/.test(m)) return null; /* sayfa açıkken kısa zamanlayıcı yeterli (beyin.js) */
    const ne = (m.match(/(?:hatırlat|haber ver|uyar)\w*\s*[:,]?\s*(.+)$/) || m.match(/^(.+?)\s+(?:diye|için)\s/) || [])[1] || '';
    const metinH = (ne.replace(/^(?:bana|beni)\s+/, '').trim() || 'Zeki\'nin hatırlatması').slice(0, 140);
    const L = hatirlatmalar(); const h = { z: t.getTime(), m: metinH, b: false }; L.push(h); L.sort((a, b) => a.z - b.z);
    const zs = t.toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    Z().zamanlayici(Math.max(1, (t - Date.now()) / 1000), metinH);
    let ek = '';
    try { await buluta(L); h.b = true; ek = ' Sayfa kapalı olsa da telefonuna bildirim gelecek; bildirimler yaklaşık 15 dakikalık aralıklarla gönderildiği için birkaç dakika gecikebilir.'; }
    catch (e) { ek = e.message === 'GIRIS' ? ' Sayfa kapalıyken de bildirim gelmesi için sitede giriş yapmış olman gerekiyor; şimdilik yalnızca bu sayfa açıkken hatırlatabilirim.' : e.message === 'IZIN' ? ' Bildirim izni verilmediği için yalnızca sayfa açıkken hatırlatabilirim.' : e.message === 'PUSH_YOK' ? ' Bu tarayıcı arka plan bildirimini desteklemiyor; iPhone\'da siteyi ana ekrana ekleyince çalışır.' : /permission|izin/i.test(e.message) ? ' Sunucu kaydı kabul etmedi; Firebase kuralına Zeki için izin eklenmesi gerekiyor.' : ' Bildirim sunucusuna ulaşamadım; yalnızca sayfa açıkken hatırlatabilirim.'; }
    LS.set('zeki:hatirlat', JSON.stringify(L));
    return { metin: `Tamam, ${zs} için hatırlatma kurdum: ${metinH}.${ek}`, duygu: 'heyecanli', beceri: 'hatirlat', ek, kart: { tip: 'liste', baslik: '⏰ Hatırlatma', satirlar: [[zs, metinH + (h.b ? ' · 📱 telefona da' : '')]] }, link: h.b ? null : (/GIRIS|giriş/.test(ek) ? '/oyunlar/' : null), kaynak: h.b ? null : 'Giriş yap' };
  }

  /* ===================== OYUNLAR ===================== */
  const BILMECE = [
    ['Ağzı var dili yok, konuşur sesi yok. Nedir?', ['mektup', 'kitap']], ['Dişleri var ama ısırmaz, saçları tarar. Nedir?', ['tarak']], ['Gece gelir, gündüz gider, yüzü yoktur ama ışık verir. Nedir?', ['ay', 'yıldız']],
    ['Akar ama yatağından hiç kalkmaz. Nedir?', ['nehir', 'ırmak', 'dere']], ['Ne kadar çok alırsan o kadar büyür. Nedir?', ['çukur', 'delik']], ['Bir evim var, kapısı penceresi yok; içinde sarı bir yavru var. Nedir?', ['yumurta']],
    ['Elleri var, ayakları yok; durmadan döner, hiç yorulmaz. Nedir?', ['saat']], ['Benim bir anahtarım var ama hiçbir kapıyı açamam. Ben neyim?', ['klavye', 'piyano']], ['Islandıkça kurur. Nedir?', ['havlu']],
    ['Herkes kırar ama kimse görmez. Nedir?', ['söz', 'sessizlik', 'kalp']], ['Uzun boylu, tek gözlü, kuyruğu da iplikli. Nedir?', ['iğne']], ['Önü var arkası var, okunur ama yazı değildir. Nedir?', ['yüz', 'surat']],
    ['Camdan bakar, dışarı çıkmaz; kendini gösterir, seni de gösterir. Nedir?', ['ayna']], ['Her gece yatar ama hiç uyumaz. Nedir?', ['yastık', 'yatak']], ['Bir binada ne kadar çok olursa o kadar aydınlık olur; cephede durur, içinden görürsün. Nedir?', ['cam', 'pencere']],
    ['Tek ayağı var, dönmeden duramaz; çocukların sevdiği oyuncaktır. Nedir?', ['topaç']], ['Önce ben gelirim, sonra gök gürler. Ben neyim?', ['şimşek', 'yıldırım']], ['Yazın giyer, kışın soyunur. Nedir?', ['ağaç']],
  ];
  const KELIME = ('elma armut ayva araba anahtar ayna ağaç aslan arı ateş bahçe balık balkon bardak bayrak bebek bisiklet bulut cam ceket cetvel çanta çay çiçek çizgi dağ dalga defter deniz dikme duvar dünya ekmek elbise eldiven fare fener fırın gemi gece gölge güneş gözlük halı hamur hava ırmak ışık inek iğne istasyon jeton kalem kapı kar kartal kase kedi kitap koltuk köprü kule kum lamba limon lokanta makas masa merdiven mektup mum müzik nar nehir orman otobüs oyun ördek pamuk pencere pera portakal radyo rüzgar saat sandalye sepet şapka şehir şemsiye şeker tabak tahta tarak tavşan telefon tren tuz uçak uzay ülke üzüm vapur vazo yağmur yastık yaprak yıldız yol yumurta zeytin zil zürafa ağaçkakan ahtapot akvaryum altın ambar anten aşçı avize bakır balon baraj bavul beton bilye boya buz cadde cephe çekiç çerçeve çorba davul demir dolap dondurma ejderha erik fidan fil fincan gazete gitar halat hamak hediye helikopter hırka ıhlamur ıspanak iskele kaya kayık kepçe keman kiraz kova kum saati lale lahana leylek liman mağara manav marangoz mendil mermer meyve mikrofon nane nota ok olta ova palmiye pasta pinpon piyano roket ruj sabun salıncak sardalya sebze sinek sıra sincap soba sünger tava tebeşir teleskop tencere testere top tuğla tünel ufuk uydu un vagon yaka yelken yengeç yorgan zebra zarf').split(' ');
  const SOSLE = (k) => k.replace(/ğ$/, 'g');
  const KIP = { aktif: null };
  const BITIR = /^(?:oyunu? (?:bitir|bırak|kapat)|bitir|çık|yeter|bırak|vazgeç|dur|tamam yeter|oyundan çık|stop|exit|türkçeye dön|kipi kapat)$/;
  function oyunBaslat(tur) {
    if (tur === 'bilmece') {
      const sira = BILMECE.slice().sort(() => Math.random() - .5).slice(0, 5); let i = 0, puan = 0;
      const sor = () => ({ metin: `${i + 1}. bilmece: ${sira[i][0]}`, duygu: 'heyecanli' });
      KIP.aktif = { ad: 'bilmece', isle(m) {
          const dogru = sira[i][1].some(c => fold(m).includes(fold(c))), pes = /bilmiyorum|pes|söyle|cevap ne|geç/.test(m);
          if (!dogru && !pes) return { metin: sec(['Hmm, değil. Bir daha dene ya da "pes" de.', 'Yaklaşmadın bile, hihi! Tekrar dene.', 'Olmadı. Bir ipucu: ' + sira[i][1][0].length + ' harfli.']), duygu: 'mutlu' };
          const on = dogru ? sec(['Bildin!', 'Aferin, doğru!', 'Evet, işte bu!']) : `Cevap: ${sira[i][1][0]}.`; if (dogru) puan++; i++;
          if (i >= sira.length) { KIP.aktif = null; return { metin: `${on} Oyun bitti; 5 bilmeceden ${puan} tanesini bildin.${puan >= 4 ? ' Bilmece ustasısın!' : ''}`, duygu: puan >= 3 ? 'mutlu' : 'notr', kart: { tip: 'basit', baslik: 'Bilmece', satirlar: [['Puan', puan + ' / 5']] } }; }
          return { metin: on + ' ' + sor().metin, duygu: dogru ? 'mutlu' : 'notr' }; } };
      return { metin: 'Bilmece oyunu! 5 bilmece soracağım. Bilemezsen "pes" de, çıkmak istersen "bitir". ' + sor().metin, duygu: 'heyecanli' };
    }
    if (tur === 'sayi') {
      const hedef = 1 + Math.floor(Math.random() * 100); let n = 0;
      KIP.aktif = { ad: 'sayi', isle(m) {
          const x = sayilastir(m).match(/-?\d+/); if (!x) return { metin: 'Bir sayı söyle, 1 ile 100 arasında.', duygu: 'notr' };
          const v = +x[0]; n++;
          if (v === hedef) { KIP.aktif = null; return { metin: `Bildin! Sayı ${hedef} idi. ${n} denemede buldun.${n <= 7 ? ' Çok iyi!' : ''}`, duygu: 'mutlu', kart: { tip: 'basit', baslik: 'Sayı tahmini', satirlar: [['Sayı', String(hedef)], ['Deneme', String(n)]] } }; }
          return { metin: (v < hedef ? sec(['Daha büyük.', 'Yukarı çık.', 'Biraz daha büyük.']) : sec(['Daha küçük.', 'Aşağı in.', 'Biraz daha küçük.'])) + (Math.abs(v - hedef) <= 3 ? ' Çok yaklaştın!' : ''), duygu: Math.abs(v - hedef) <= 3 ? 'heyecanli' : 'dusunceli' }; } };
      return { metin: '1 ile 100 arasında bir sayı tuttum. Tahmin et bakalım!', duygu: 'heyecanli' };
    }
    if (tur === 'zincir') {
      const kul = new Set(); let son = sec(KELIME); kul.add(son); let puan = 0;
      const harf = w => { const k = SOSLE(w); return k[k.length - 1]; };
      KIP.aktif = { ad: 'zincir', isle(m) {
          const w = kucuk(m).replace(/[^a-zçğıöşüâî ]/g, '').trim().split(/\s+/).pop() || '';
          if (/pes|bilmiyorum/.test(m)) { KIP.aktif = null; const ip = KELIME.find(k => k[0] === harf(son) && !kul.has(k)); return { metin: `Pes mi? ${ip ? 'Mesela "' + ip + '" diyebilirdin. ' : ''}${puan} kelime söyledin, güzel oyundu!`, duygu: 'mutlu' }; }
          if (w.length < 2) return { metin: `"${harf(son).toLocaleUpperCase('tr')}" harfiyle başlayan bir kelime söyle.`, duygu: 'notr' };
          if (w[0] !== harf(son)) return { metin: `"${w}" ${harf(son).toLocaleUpperCase('tr')} ile başlamıyor. Benim kelimem "${son}" idi.`, duygu: 'saskin' };
          if (kul.has(w)) return { metin: `"${w}" daha önce söylendi! Başka bir kelime bul.`, duygu: 'saskin' };
          kul.add(w); puan++;
          const cev = KELIME.filter(k => k[0] === harf(w) && !kul.has(k));
          if (!cev.length) { KIP.aktif = null; return { metin: `"${harf(w).toLocaleUpperCase('tr')}" ile başlayan kelime bulamadım; sen kazandın! ${puan} kelime söyledin.`, duygu: 'uzgun' }; }
          son = sec(cev); kul.add(son); return { metin: `${son}. Şimdi "${harf(son).toLocaleUpperCase('tr')}" harfi.`, duygu: 'mutlu' }; } };
      return { metin: `Kelime zinciri! Ben bir kelime söyleyeceğim, sen son harfiyle başlayan bir kelime söyleyeceksin. Benim kelimem: ${son}. "${harf(son).toLocaleUpperCase('tr')}" harfiyle başla.`, duygu: 'heyecanli' };
    }
    if (tur === 'matematik') {
      let i = 0, puan = 0, t0 = 0, soru = null; const zor = (k) => { const a = 2 + Math.floor(Math.random() * (k < 3 ? 10 : k < 6 ? 30 : 90)), b = 2 + Math.floor(Math.random() * (k < 6 ? 10 : 20)), op = sec(k < 3 ? ['+', '-'] : ['+', '-', '×']); return { s: `${a} ${op === '-' ? 'eksi' : op === '+' ? 'artı' : 'çarpı'} ${b}`, c: op === '+' ? a + b : op === '-' ? a - b : a * b }; };
      const sor = () => { soru = zor(i); t0 = Date.now(); return `${i + 1}. soru: ${soru.s} kaç eder?`; };
      KIP.aktif = { ad: 'matematik', isle(m) {
          const x = sayilastir(m).match(/-?\d+/); if (!x) return { metin: 'Bir sayı söyle. Soru: ' + soru.s + '?', duygu: 'notr' };
          const ok = +x[0] === soru.c, sure = (Date.now() - t0) / 1000; if (ok) puan++; i++;
          const on = ok ? sec(['Doğru!', 'Evet!', 'Süper!']) + (sure < 4 ? ' Hem de çok hızlı.' : '') : `Değil, cevap ${soru.c}.`;
          if (i >= 10) { KIP.aktif = null; return { metin: `${on} Yarış bitti: 10 sorudan ${puan} doğru.`, duygu: puan >= 7 ? 'mutlu' : 'notr', kart: { tip: 'basit', baslik: 'Matematik yarışı', satirlar: [['Doğru', puan + ' / 10']] } }; }
          return { metin: on + ' ' + sor(), duygu: ok ? 'mutlu' : 'uzgun' }; } };
      return { metin: 'Matematik yarışı! 10 soru, gittikçe zorlaşacak. ' + sor(), duygu: 'heyecanli' };
    }
    if (tur === 'terim') {
      return B.sozluk().then(() => {
        const T = (window.CEPHE_TERIM || []).filter(x => x[2].length < 30); if (T.length < 10) return { metin: 'Terim verisine ulaşamadım.', duygu: 'uzgun' };
        let i = 0, puan = 0, s = null; const H = ['A', 'B', 'C'];
        const sor = () => { const x = sec(T), c = T.filter(y => y[1] === x[1] && y[0] !== x[0]).sort(() => Math.random() - .5).slice(0, 2); while (c.length < 2) c.push(sec(T)); const sk = [x, ...c].sort(() => Math.random() - .5); s = { x, sk, d: sk.indexOf(x) };
          return `${i + 1}. soru: ${String(x[4]).split(/(?<=[.;])\s/)[0]} Bu hangisi? ${sk.map((y, j) => H[j] + ': ' + y[2]).join(', ')}.`; };
        KIP.aktif = { ad: 'terim', isle(m) {
            const f = fold(m); let c = H.findIndex(h => new RegExp('^(?:' + h.toLowerCase() + '|' + h.toLowerCase() + ' şıkkı|cevap ' + h.toLowerCase() + ')$').test(f.trim()));
            if (c < 0) c = s.sk.findIndex(y => f.includes(fold(y[2]).replace(/\(.*?\)/g, '').trim().split(' ')[0]));
            if (c < 0) return { metin: 'A, B ya da C de; ya da terimin adını söyle.', duygu: 'notr' };
            const ok = c === s.d; if (ok) puan++; i++;
            const on = ok ? sec(['Doğru!', 'Bildin!']) : `Doğrusu ${H[s.d]}: ${s.x[2]}.`;
            if (i >= 5) { KIP.aktif = null; return { metin: `${on} Sınav bitti: 5 sorudan ${puan} doğru.${puan === 5 ? ' Tam puan, cephe uzmanısın!' : ''}`, duygu: puan >= 3 ? 'mutlu' : 'notr', link: '/egitimler/sozluk/', kaynak: 'Sözlük', kart: { tip: 'basit', baslik: 'Cephe terimi sınavı', satirlar: [['Doğru', puan + ' / 5']] } }; }
            return { metin: on + ' ' + sor(), duygu: ok ? 'mutlu' : 'notr' }; } };
        return { metin: 'Cephe terimi sınavı! 5 soru, her birinde 3 şık. ' + sor(), duygu: 'heyecanli' };
      });
    }
  }
  function oyun(m) {
    if (/bilmece/.test(m) && /sor|oyna|oynayalım|söyle|bil/.test(m)) return oyunBaslat('bilmece');
    if (/sayı (?:tahmin|tut)|sayı tahmin oyunu|bir sayı tut/.test(m) && !/arası/.test(m)) return oyunBaslat('sayi');
    if (/kelime (?:zinciri|oyunu|türetme)|son harf oyunu/.test(m)) return oyunBaslat('zincir');
    if (/matematik (?:yarışı|oyunu|soruları|sor)|işlem yarışı|hesap yarışı/.test(m)) return oyunBaslat('matematik');
    if (/(?:cephe )?terim(?:i)? (?:sınavı|testi|yarışması|oyunu)|beni sına|cephe sınavı/.test(m)) return oyunBaslat('terim');
    if (/(?:oyun|oyunlar)\w* (?:oynayalım|neler|var mı|oyna)|bir oyun (?:oynayalım|oyna)|oyun oynayalım/.test(m)) return { metin: 'Sesli oyunlarım: bilmece, sayı tahmini, kelime zinciri, matematik yarışı ve cephe terimi sınavı. Hangisini oynayalım?', duygu: 'heyecanli', kart: { tip: 'secenek', baslik: 'Sesli oyunlar', secenekler: ['Bilmece sor', 'Sayı tahmin oyunu', 'Kelime zinciri', 'Matematik yarışı', 'Cephe terimi sınavı'] } };
    return null;
  }

  /* ===================== DİL KONUŞMA PARTNERİ ===================== */
  const DILLER = { en: { ad: 'İngilizce', kod: 'en-US', whisper: 'english', llm: 'English', sel: 'Hi! Let\'s talk in English. How was your day?', kulup: '/ingilizce.html' }, fr: { ad: 'Fransızca', kod: 'fr-FR', whisper: 'french', llm: 'French', sel: 'Bonjour ! Parlons en français. Comment s\'est passée ta journée ?', kulup: '/fransizca.html' }, de: { ad: 'Almanca', kod: 'de-DE', whisper: 'german', llm: 'German', sel: 'Hallo! Lass uns Deutsch sprechen. Wie war dein Tag?', kulup: '/almanca.html' } };
  const benzer = (a, b) => { a = fold(a).replace(/[^a-z0-9 ]/g, ''); b = fold(b).replace(/[^a-z0-9 ]/g, ''); const A = a.split(' ').filter(Boolean), Bk = new Set(b.split(' ').filter(Boolean)); return A.length ? A.filter(w => Bk.has(w)).length / Math.max(A.length, Bk.size) : 0; };
  async function dilKipi(m) {
    const x = m.match(/(ingilizce|fransızca|almanca)\s*(?:konuşalım|pratik(?: yapalım)?|konuşma (?:pratiği|partneri)|çalışalım|öğret)/); if (!x) return null;
    const k = { ingilizce: 'en', fransızca: 'fr', almanca: 'de' }[x[1]], D = DILLER[k];
    await ydYukle(); const S = YD[k] || {}, anahtar = Object.keys(S);
    if (B.LLM.durum === 'hazir') {
      const gecmis = [];
      KIP.aktif = { ad: 'dil', dil: D.kod, whisper: D.whisper, async isle(mm, ham) {
          gecmis.push({ role: 'user', content: ham });
          const r = await B.llmUret([{ role: 'system', content: `You are Zeki, a friendly ${D.llm} conversation partner for a Turkish learner. Always reply only in ${D.llm}, in 1-2 short, simple sentences, and end with a question to keep the conversation going. If the learner's sentence has a mistake, start with "${k === 'en' ? 'Better' : k === 'fr' ? 'Mieux' : 'Besser'}: <corrected sentence>." and then continue. No emojis, no lists.` }, ...gecmis.slice(-8)], 120);
          gecmis.push({ role: 'assistant', content: r });
          return { metin: r, parcalar: [{ m: r, dil: D.kod }], duygu: 'mutlu', dil: D.kod };
        } };
      return { metin: `${D.ad} konuşma kipi açıldı. Seni ${D.ad.toLocaleLowerCase('tr')} dinleyeceğim; Türkçeye dönmek için "Türkçeye dön" de.`, parcalar: [{ m: `${D.ad} konuşma kipi açıldı; Türkçeye dönmek için "Türkçeye dön" de.` }, { m: D.sel, dil: D.kod }], duygu: 'heyecanli', dil: D.kod };
    }
    if (!anahtar.length) return { metin: `${D.ad} kelime listesine ulaşamadım.`, duygu: 'uzgun' };
    /* dil modeli yoksa: kelime ve cümle pratiği */
    const sira = anahtar.slice().sort(() => Math.random() - .5).slice(0, 6); let i = 0, asama = 'kelime', puan = 0;
    const kelimeSor = () => { const w = S[sira[i]]; return [{ m: `${i + 1}. kelime: "${w[1]}". ${D.ad}si ne?` }]; };
    KIP.aktif = { ad: 'dil', dil: D.kod, whisper: D.whisper, isle(mm, ham) {
        const w = S[sira[i]];
        if (asama === 'kelime') {
          const ok = fold(ham).includes(fold(w[0])); if (ok) puan++; asama = 'cumle';
          return { parcalar: [{ m: ok ? 'Doğru!' : 'Doğrusu:' }, { m: w[0], dil: D.kod }, { m: '. Şimdi şu cümleyi tekrar et:' }, { m: w[2], dil: D.kod }], metin: `${ok ? 'Doğru!' : 'Doğrusu: ' + w[0] + '.'} Tekrar et: ${w[2]} (${w[3]})`, duygu: ok ? 'mutlu' : 'notr', dil: D.kod };
        }
        const b = benzer(ham, w[2]); i++; asama = 'kelime'; const on = b > .75 ? 'Harika telaffuz!' : b > .45 ? 'Fena değil, birkaç kelime eksik kaldı.' : 'Bir daha deneyebilirsin; şimdilik devam edelim.';
        if (i >= sira.length) { KIP.aktif = null; return { metin: `${on} Pratik bitti; ${sira.length} kelimeden ${puan} tanesini bildin. Daha fazlası ${D.ad} Kulübü'nde.`, duygu: 'mutlu', dil: 'tr-TR', link: D.kulup, kaynak: D.ad + ' Kulübü' }; }
        return { parcalar: [{ m: on }, ...kelimeSor()], metin: on + ' ' + kelimeSor()[0].m, duygu: b > .45 ? 'mutlu' : 'notr', dil: 'tr-TR', sonrakiDil: 'tr-TR' };
      } };
    /* kelime aşamasında Türkçe soru ama yabancı cevap bekleniyor */
    return { metin: `${D.ad} pratiği! Gelişmiş beyin kapalı olduğu için kelime ve telaffuz çalışacağız. Türkçesini söyleyeceğim, sen ${D.ad.toLocaleLowerCase('tr')} karşılığını söyle; sonra örnek cümleyi tekrar et. ` + kelimeSor()[0].m, parcalar: [{ m: `${D.ad} pratiği! Türkçesini söyleyeceğim, sen ${D.ad.toLocaleLowerCase('tr')} karşılığını söyle; sonra örnek cümleyi tekrar et.` }, ...kelimeSor()], duygu: 'heyecanli', dil: D.kod };
  }

  /* ===================== ÇOCUK KİPİ: hikâye ve hayvan sesleri ===================== */
  const HIKAYE = [
    ['Minik Robot ve Kayıp Vida', 'Bir zamanlar Pıtır adında minik bir robot varmış. Bir sabah uyanmış ki sol kolundaki vida kaybolmuş! Kolunu sallayınca tıngır mıngır ses çıkıyormuş. Pıtır bahçeye çıkmış ve karıncalara sormuş: Vidamı gördünüz mü? Karıncalar onu çiçeklerin arasına götürmüş. Vida, bir papatyanın yaprağında parıldıyormuş. Pıtır vidasını takmış, karıncalara teşekkür etmiş ve o günden sonra her sabah onlara şeker getirmiş.'],
    ['Bulut Pamuk', 'Gökyüzünde Pamuk adında küçük bir bulut yaşarmış. Diğer bulutlar yağmur yağdırırken Pamuk hiç damla çıkaramazmış. Bir gün kurumuş bir tarlanın üstünden geçerken çiçeklerin susadığını görmüş. Pamuk tüm gücüyle sıkmış kendini, sıkmış, sıkmış… ve pıt pıt pıt, ilk damlaları düşmüş! Çiçekler başlarını kaldırıp gülümsemiş. Pamuk o gün yardım etmenin en güzel duygu olduğunu öğrenmiş.'],
    ['Cesur Kaplumbağa Tosbi', 'Tosbi adında bir kaplumbağa, ormandaki yarışmaya katılmak istemiş. Herkes gülmüş: Sen çok yavaşsın! Tosbi vazgeçmemiş; her gün biraz daha yürümüş. Yarış günü tavşan yolda oyuna dalmış, sincap ceviz toplamaya gitmiş. Tosbi ise hiç durmadan yürümüş ve bitiş çizgisine ilk o varmış. Yavaş ama kararlı olan kazanırmış.'],
    ['Yıldızları Sayan Kız', 'Ela her gece penceresinden yıldızları sayarmış: bir, iki, üç… Ama hep uyuyakalırmış. Bir gece bir yıldız aşağı süzülmüş ve demiş ki: Bizi saymana gerek yok, biz hep buradayız. Sen sadece bize bakıp iyi dileklerde bulun. Ela o gece bir dilek tutmuş ve gülümseyerek uyumuş. Sabah olduğunda dileğinin ne olduğunu kimseye söylememiş.'],
    ['Kule Yapan Fil', 'Küçük fil Fındık, en yüksek kuleyi yapmak istemiş. Blokları üst üste koymuş ama hortumu çarpınca hepsi yıkılmış. Fındık üzülmüş ama tekrar başlamış. Bu sefer en büyük blokları alta, küçükleri üste koymuş. Kule bu kez sapasağlam durmuş! Fındık, sağlam bir temelin her şeyin başı olduğunu öğrenmiş.'],
    ['Uyumayan Baykuş', 'Baykuş Hu Hu gündüzleri uyur, geceleri uyanırmış. Bir gün arkadaşlarıyla gündüz oynamak istemiş. Ama öğlen olunca gözleri kapanıvermiş. Arkadaşları da bir gece onu ziyarete gelmiş; ama onlar da uyuyakalmış! Sonunda herkes anlaşmış: akşamüstü, güneş batarken buluşacaklar. O günden sonra en güzel oyunlarını gün batımında oynamışlar.'],
  ];
  const HAYVAN = { kedi: 'Miyav miyav!', köpek: 'Hav hav!', kuş: 'Cik cik cik!', inek: 'Möööö!', koyun: 'Meee!', keçi: 'Meee meee!', at: 'İhihihi!', tavuk: 'Gıt gıt gıdak!', horoz: 'Ü ürü üüü!', ördek: 'Vak vak!', kurbağa: 'Vrak vrak!', aslan: 'Rooaarr!', kaz: 'Gak gak!', baykuş: 'Hu huuu!', arı: 'Vızzzz!', yılan: 'Tsss!', domuz: 'Ok ok!', eşek: 'Aaaii aaai!', fil: 'Pruuuuu!', kuzu: 'Meee!', civciv: 'Cik cik!', karga: 'Gak gak!', kurt: 'Auuuuu!', maymun: 'Uu uu aa aa!' };
  function cocuk(m) {
    if (/(?:bir\s+)?(?:hikaye|hikâye|masal)\s*(?:anlat|oku|söyle)|uyku masalı/.test(m)) { const h = sec(HIKAYE); return { metin: `${h[0]}. ${h[1]}`, duygu: 'mutlu', beceri: 'hikaye', kart: { tip: 'basit', baslik: '📖 ' + h[0], satirlar: [] } }; }
    const x = m.match(/([a-zçğıöşü]+?)(?:lar|ler)?\s*(?:nasıl|ne)\s*(?:ses çıkarır|ses yapar|der|bağırır|öter|havlar|miyavlar)|([a-zçğıöşü]+?)\s*sesi(?:ni)?\s*(?:çıkar|yap|taklit et)/);
    if (x) { const h = Object.keys(HAYVAN).find(k => (x[1] || x[2] || '').startsWith(k)); if (h) return { metin: `${h.charAt(0).toLocaleUpperCase('tr') + h.slice(1)} şöyle der: ${HAYVAN[h]}`, duygu: 'mutlu', beceri: 'hayvan' }; }
    return null;
  }

  /* ===================== KİŞİLİK ===================== */
  const KISILIK = {
    neseli: { ad: 'Neşeli', istem: 'Neşeli, sıcak ve enerjik konuş.', perde: 1.15 },
    ciddi: { ad: 'Ciddi asistan', istem: 'Ciddi, net ve profesyonel konuş; şaka ve ünlem kullanma.', perde: 1.0 },
    esprili: { ad: 'Esprili', istem: 'Esprili konuş; uygun yerlerde kısa, zararsız bir şaka ya da kelime oyunu ekle.', perde: 1.1 },
    cocuk: { ad: 'Çocuk kipi', istem: 'Bir çocukla konuşuyorsun. Çok basit kelimeler ve kısa cümleler kullan, sabırlı ve cesaretlendirici ol. Çocuğa uygun olmayan hiçbir konuya girme; böyle bir soru gelirse nazikçe bir büyüğüne sormasını öner.', perde: 1.35 },
  };
  const SAKA = ['Bunu söylerken devrelerim gıdıklandı.', 'Bu bilgiyi hafızamın en güzel köşesine koydum.', 'Robotlar da bazen şaşırır, ama ben şaşırmadım!', 'Bunu bilmek için çok bayt harcadım.'];
  function kisilikUygula(r) {
    const k = (Z() && Z().AYAR.kisilik) || 'neseli'; if (!r || !r.metin || r.parcalar || KIP.aktif) return r;
    if (k === 'ciddi') { r.metin = r.metin.replace(/!+/g, '.').replace(/\s*(?:Hihi|Hahaha|hihi|Ooo|Vay canına)[,!.]*\s*/g, ' ').trim(); if (r.duygu === 'heyecanli') r.duygu = 'notr'; }
    if (k === 'esprili' && ['hesap', 'birim', 'hava', 'doviz', 'sozluk', 'vikipedi', 'saat', 'tarih'].includes(r.beceri) && Math.random() < .4) r.metin += ' ' + sec(SAKA);
    return r;
  }
  B.kisilikIstem = () => (KISILIK[(Z() && Z().AYAR.kisilik) || 'neseli'] || KISILIK.neseli).istem;

  /* ===================== kayıt ===================== */
  B.ek.unshift(async (m, ops, ham) => {
    /* çok adımlı kip (oyun, dil pratiği) */
    if (KIP.aktif) {
      if (BITIR.test(m.trim())) { const a = KIP.aktif.ad; KIP.aktif = null; return { metin: a === 'dil' ? 'Türkçeye döndüm. Güzel pratik oldu!' : 'Oyunu bitirdim. Yine oynarız!', duygu: 'mutlu', dil: 'tr-TR' }; }
      const r = await KIP.aktif.isle(m, ham); if (r) return Object.assign({ beceri: 'kip' }, r);
    }
    const s = m;
    for (const f of [cevir, projeSorgu, pomodoro, cocuk]) { const r = f(s); if (r) return kisilikUygula(r); }
    for (const f of [oyun, dilKipi, hatirlat, sesliHesap]) { const r = await f(s); if (r) return kisilikUygula(r); }
    if (/^(?:günaydın(?: zeki)?|sabah özeti|günün özeti|bugün neler var|güne başlayalım|günü özetle)$/.test(s) && (s !== 'günaydın' || LS.get('zeki:ozetGun') !== String(gunNo()))) return sabahOzeti();
    if (/^(?:sabah özeti|günün özeti|özet ver)/.test(s)) return sabahOzeti();
    return null;
  });
  B.sonIsle = kisilikUygula;
  B.KIP = KIP; B.KISILIK = KISILIK; B.DILLER = DILLER;
  B.ozel = { cevir, sesliHesap, projeSorgu, sabahOzeti, zamanCoz, hatirlatmalar, olcuculer, HESAP };
})();
