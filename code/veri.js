/* CODE sayfası: hazır örnek veri setleri (+ Dosya › Hazır veri setleri).
   Uydurma, gerçekçi cephe/imalat verileri; her biri projeye dosya olarak eklenir. */
(() => {
  // tekrarlanabilir sözde rastgele
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];

  const cepheler = ['Kuzey', 'Güney', 'Doğu', 'Batı'];
  const camlar = ['6+12+6', '8+16+8', '10+16+10', '8+16+44.2', '44.2+16+8'];
  const kg_m2 = { '6+12+6': 30, '8+16+8': 40, '10+16+10': 50, '8+16+44.2': 62.5, '44.2+16+8': 62.5 };
  const durum = ['üretimde', 'sevk edildi', 'montajda', 'tamamlandı'];
  const p = ['panel,cephe,kat,gen_mm,yuk_mm,cam,kg,durum'];
  for (let i = 1; i <= 120; i++) {
    const c = pick(cepheler), g = pick([900, 1200, 1200, 1500, 1500, 1800]), y = pick([2100, 2400, 2700, 3000, 3300]), cam = pick(camlar);
    const kg = (g * y / 1e6 * kg_m2[cam]).toFixed(1);
    p.push(`P${String(i).padStart(3, '0')},${c},${1 + Math.floor(rnd() * 12)},${g},${y},${cam},${kg},${pick(durum)}`);
  }

  const prof = ['kod,ad,seri,kg_m,boy_mm,stok_adet,birim_fiyat_tl',
    'AL-120,Dikme 120,FW50,2.85,6000,140,1180', 'AL-150,Dikme 150,FW50,3.42,6000,64,1395', 'AL-80,Kayıt 80,FW50,1.62,6000,210,690',
    'AL-60,Kayıt 60,FW50,1.21,6000,180,540', 'AL-50,Baskı,FW50,0.74,6000,420,310', 'AL-K1,Kapak düz,FW50,0.38,6000,600,180',
    'AL-K2,Kapak yuvarlak,FW50,0.44,6000,320,205', 'PL-12,Pencere kasa,W72,1.38,6500,95,615', 'PL-13,Pencere kanat,W72,1.52,6500,88,660',
    'PL-20,Kapı kasa,D80,2.06,6500,40,905', 'PL-21,Kapı kanat,D80,2.31,6500,36,1010', 'ST-40,Çelik ankraj,—,4.10,3000,75,860'];

  const ay = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const u = ['ay,panel_m2,cam_m2,profil_kg,fire_yuzde,personel'];
  ay.forEach((a, i) => { const base = 900 + 350 * Math.sin(i / 1.9) + rnd() * 120; u.push(`${a},${base.toFixed(0)},${(base * 0.92).toFixed(0)},${(base * 4.6 + rnd() * 300).toFixed(0)},${(3 + rnd() * 4).toFixed(1)},${38 + Math.floor(rnd() * 9)}`); });

  const musteri = ['Arda Yapı', 'Kule İnşaat', 'Mavi Konut', 'Ege Plaza', 'Delta AVM', 'Atlas Ofis'];
  const o = ['siparis,tarih,musteri,urun,adet,birim_tl'];
  for (let i = 1; i <= 60; i++) {
    const d = new Date(2026, Math.floor(rnd() * 10), 1 + Math.floor(rnd() * 27));
    const ur = pick(['Cephe paneli', 'Pencere', 'Kapı', 'Cam (m²)', 'Kapak profili']);
    const bf = { 'Cephe paneli': 8400, 'Pencere': 5200, 'Kapı': 11800, 'Cam (m²)': 1450, 'Kapak profili': 220 }[ur];
    o.push(`S-${1000 + i},${d.toISOString().slice(0, 10)},${pick(musteri)},${ur},${1 + Math.floor(rnd() * 40)},${Math.round(bf * (0.9 + rnd() * 0.25))}`);
  }

  const camTip = [
    { kod: '6+12+6', aciklama: 'Standart ısıcam', kalinlik_mm: 24, kg_m2: 30, Ug: 2.7, renk: 'şeffaf' },
    { kod: '8+16+8', aciklama: 'Low-E ısıcam', kalinlik_mm: 32, kg_m2: 40, Ug: 1.1, renk: 'şeffaf' },
    { kod: '10+16+10', aciklama: 'Kalın ısıcam', kalinlik_mm: 36, kg_m2: 50, Ug: 1.1, renk: 'şeffaf' },
    { kod: '8+16+44.2', aciklama: 'Lamine güvenlik ısıcam', kalinlik_mm: 33, kg_m2: 62.5, Ug: 1.0, renk: 'füme' },
    { kod: '6+12+6+12+6', aciklama: 'Üçlü cam', kalinlik_mm: 42, kg_m2: 45, Ug: 0.6, renk: 'şeffaf' }
  ];

  const sicaklik = ['saat,dis_c,ic_c,cam_yuzey_c'];
  for (let h = 0; h < 24; h++) { const d = 4 + 7 * Math.sin((h - 9) / 24 * 2 * Math.PI) + rnd(); sicaklik.push(`${h},${d.toFixed(1)},${(21 + rnd() * 0.8).toFixed(1)},${(17 + 0.15 * d + rnd() * 0.4).toFixed(1)}`); }

  window.CODE_DATA = [
    { n: 'paneller.csv', d: '120 cephe paneli: cephe, kat, ölçü, cam, ağırlık, durum', c: p.join('\n') + '\n' },
    { n: 'profiller.csv', d: '12 alüminyum/çelik profil: kg/m, stok, fiyat', c: prof.join('\n') + '\n' },
    { n: 'uretim.csv', d: '12 aylık üretim: m², kg, fire oranı, personel', c: u.join('\n') + '\n' },
    { n: 'siparisler.csv', d: '60 sipariş: tarih, müşteri, ürün, adet, birim fiyat', c: o.join('\n') + '\n' },
    { n: 'cam_tipleri.json', d: '5 cam dizilimi: kalınlık, kg/m², Ug değeri', c: JSON.stringify(camTip, null, 2) + '\n' },
    { n: 'sicaklik.csv', d: '24 saatlik dış/iç/cam yüzeyi sıcaklığı', c: sicaklik.join('\n') + '\n' }
  ];
})();
