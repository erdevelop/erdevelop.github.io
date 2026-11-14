## Hedef ve AutoCAD mantığı

Gün sonunda bir ankraj plakasını ve bir cephe modül çerçevesini ölçüsünde, hassas çizim araçlarıyla çizmiş olacaksın. Süre yaklaşık 5 saat. Dosya: `Gun1_Plaka.dwg`.

AutoCAD'de her şey **gerçek ölçüde** (1:1) çizilir. Ölçek, çizim bitince paftaya (layout) koyarken verilir. 1500 mm'lik bir modül, modelde 1500 birimdir. Bu kural, AutoCAD'i yeni öğrenenlerin en sık karıştırdığı konudur.

| Kavram | Anlamı |
| --- | --- |
| Model space | Gerçek ölçüde çizim yapılan sonsuz alan |
| Layout (paper space) | Paftanın düzenlendiği, ölçeklendiği ve yazdırıldığı alan (6. gün) |
| Komut satırı | Komutun ne istediğini yazar; ne yapacağını her zaman buradan oku |
| Nesne yakalama (OSNAP) | Uç, orta, merkez gibi noktalara tam oturma |

## 1. Hazırlık (45 dk)

1. AutoCAD'i aç, **New** ile `acadiso.dwt` şablonundan başla (metrik).
2. **UNITS** komutu: Length type **Decimal**, Precision **0**, Insertion scale **Millimeters**.
3. Ekranı tanı:
    - **Ribbon** (üst): Home sekmesi temel çizim ve düzenleme komutlarını içerir.
    - **Komut satırı** (alt): komut yazılır, seçenekler köşeli parantez içinde görünür.
    - **Durum çubuğu** (en alt): Grid, Snap, Ortho, Polar, Osnap, Otrack, Dinamik giriş.
4. İlk gün ezberlenecek tuşlar:

| Tuş | İşlev |
| --- | --- |
| Enter / boşluk | Komutu bitir ya da son komutu tekrarla |
| Esc | Komuttan çık |
| F3 | Nesne yakalama (Osnap) aç/kapa |
| F8 | Ortho: sadece yatay ve dikey |
| F10 | Polar izleme: belirli açılarda kılavuz |
| F11 | Nesne izleme (Otrack): noktalardan hizalanan kılavuz çizgiler |
| F12 | Dinamik giriş: imlecin yanında ölçü kutuları |
| Orta tuş | Kaydır; çift tıkla: her şeyi göster (Zoom Extents) |

## 2. Koordinat girişi (1 saat)

| Ne yazarsın | Anlamı |
| --- | --- |
| `0,0` | Mutlak koordinat (dinamik giriş açıkken `#0,0`) |
| `@200,0` | Son noktaya göre göreli |
| `@150<90` | Göreli polar: 150 birim, 90° yönünde |
| `200` + yön | Ortho ya da polar açıkken mesafe yazıp Enter |

@fig:koordinat

**Alıştırma: ankraj plakası**

1. **LINE** (L): `0,0` → `@200,0` → `@0,150` → `@-200,0` → **C** (Close). 200 x 150 mm dikdörtgen.
2. Aynı plakayı **RECTANG** (REC) ile çiz: ilk köşe `300,0`, karşı köşe `@200,150`. Tek nesne olarak çizildiğini gör.
3. **FILLET** (F) ile köşelere R10 ver: Radius seçeneği **R**, 10, sonra iki kenarı seç. **Multiple** ile dört köşeyi art arda yap.
4. **CIRCLE** (C) ile köşelerden 30'ar mm içeride Ø14 delikler.

## 3. Nesne yakalama ve izleme (1,5 saat)

Elle "aşağı yukarı" tıklamak AutoCAD'de yasaktır. Her nokta ya koordinatla ya da bir nesneye yakalanarak verilir.

@fig:osnap

1. **OSNAP** ayarlarında Endpoint, Midpoint, Center, Intersection ve Perpendicular'ı aç. Hepsini açık tutmak kalabalık yapar; gerektikçe ekle.
2. Geçici yakalama: komut içindeyken **Shift + sağ tık** ile o tek tıklama için yakalama türü seç.
3. **Otrack** (F11) ile iki noktadan hizalanan kesişime tıkla: plakanın tam ortası, iki kenarın orta noktalarından gelen kılavuzların kesişimidir. Delik merkezini bu yolla bul.
4. **Polar** (F10) açısını 15° ya da 45° yap; eğik çizgileri tam açıda çiz.

**Alıştırma: oval delik**

1. Plakanın ortasına, Otrack ile merkez bulup **CIRCLE** ile Ø14 iki daire çiz, aralarında 16 mm olsun.
2. Dairelerin tepe ve dip noktalarını **LINE** ile birleştir (Quadrant yakalaması).
3. **TRIM** (TR) ile iç yarım daireleri sil. Oval delik oluştu.
4. **PEDIT** (PE) ya da **JOIN** (J) ile parçaları tek kapalı polyline yap.

## 4. Polyline ve modül çerçevesi (1 saat)

1. **PLINE** (PL) ile 1500 x 3500 mm modül sınırını çiz: tek nesne, kapalı.
2. **OFFSET** (O) ile 60 mm içeri: profil iç hattı.
3. Spandrel hattı: modül tabanından 1100 mm yukarıda yatay çizgi. Otrack ile kenarın orta noktasını takip et ya da **LINE** başlangıcını `From` geçici yakalamasıyla ver.
4. **LIST** (LI) ile polyline'ın alan ve çevresini oku. **AREA** ile seçili kapalı nesnenin alanını ölç.
5. Kaydet: `Gun1_Plaka.dwg`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Model space'te gerçek ölçüde çizmenin neden kural olduğunu biliyorum.
- [ ] Mutlak, göreli ve polar koordinatla çizebiliyorum.
- [ ] Osnap, Ortho, Polar ve Otrack'i ne zaman açacağımı biliyorum.
- [ ] Geçici yakalamayı (Shift + sağ tık) kullanabiliyorum.
- [ ] TRIM ve JOIN ile oval delik çizebiliyorum.
- [ ] PLINE, OFFSET ve AREA kullanabiliyorum.

**Bonus:** Plakayı **Parametric** sekmesindeki geometrik ve ölçü kısıtlarıyla (constraints) çiz. Genişlik ölçüsünü 200'den 250'ye değiştirince deliklerin kenardan 30 mm'de kalmasını sağla.
