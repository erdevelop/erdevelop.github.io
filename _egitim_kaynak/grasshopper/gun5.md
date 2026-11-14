## Hedef

Gün sonunda bir noktaya ya da bir görsele göre değişen iki cephe deseni yapmış olacaksın: delik çapı değişen perfore bir kaplama ve açısı değişen dikey güneş kırıcılar. Süre yaklaşık 5 saat. Dosya: `Gun5_Desen.gh`.

Attractor (çekici), bir değeri bir noktaya, eğriye ya da görsele olan ilişkisinden türetme yöntemidir. Parametrik cephelerin büyük kısmı bu basit fikirle yapılır.

## 1. Attractor mantığı (1 saat)

Her attractor tanımı aynı dört adımı izler:

1. **Ölç:** Her öğe için bir değer bul (ör. çekici noktaya **Distance**).
2. **Normalle:** Değerleri **Bounds** + **Remap Numbers** ile 0-1 aralığına getir.
3. **Şekillendir:** **Graph Mapper** ile değişimin karakterini ver (doğrusal, yumuşak, keskin).
4. **Uygula:** 0-1 değerini istenen aralığa remap et ve geometriye ver (yarıçap, açı, yükseklik).

@fig:attractor

## 2. Perfore kaplama (2 saat)

Hedef: 3000 x 1500 mm bir alüminyum panelde, çekici noktaya yaklaştıkça büyüyen delikler.

1. Rhino'da 3000 x 1500 bir dikdörtgen çiz. **Boundary Surfaces** ile yüzey yap.
2. **Divide Domain²** + **Evaluate Surface** (uv = {0.5, 0.5}) ile 30 x 15 ızgarada delik merkezleri. Ya da **Populate Geometry** ile düzensiz dağılım.
3. Rhino'da bir nokta koy, **Point** parametresine bağla: çekici.
4. **Distance**: her merkezin çekiciye uzaklığı.
5. **Bounds** + **Remap Numbers**: 0-1. Yakın olan 1 olsun diye hedef aralığı 1 To 0 ver.
6. **Graph Mapper** ile şekillendir, sonra **Remap** ile 5-40 mm çap aralığına getir.
7. **Circle**: merkezler ve yarıçaplar (çap / 2).
8. İmalat kontrolü: en küçük delik 5 mm'den, iki delik arası köprü 3 mm'den küçük olmamalı. Izgara aralığından en büyük çapı çıkararak köprüyü hesapla ve Panel'de göster.
9. Rhino'da çekiciyi sürükle: desen canlı değişir.

**Görselden desen**

1. **Image Sampler**: bir siyah-beyaz görsel seç (bir logo değil, soyut bir gradyan ya da bulut fotoğrafı).
2. Delik merkezlerini görselin 0-1 alanına göre ver (uv'leri **Deconstruct Point** ile X ve Y olarak kullan).
3. Parlaklık değeri delik çapını belirler. Uzaktan bakınca cephede görsel belirir.

## 3. Güneş kırıcı kanatlar (1,5 saat)

Hedef: 4. günün kavisli cephesinin önünde, her aksta dikey bir kanat. Kanatların açısı çekici eğriye uzaklığa göre değişsin.

1. 4. günün yüzeyinin alt kenarını **Divide Curve** ile 500 mm aralıkla böl: kanat noktaları.
2. Her noktada cepheye dik bir düzlem kur (**Perp Frames** ya da yüzey normaliyle).
3. Kanat: her düzlemde 250 x 3500 mm bir dikdörtgen (**Rectangle** + **Boundary Surfaces**), cepheden 300 mm önde.
4. Çekici olarak Rhino'da bir eğri çiz. **Curve Closest Point** ile her kanadın eğriye uzaklığını bul.
5. Mesafeyi 0-1'e, sonra 0-75 dereceye remap et. **Rotate** ile her kanadı kendi düşey ekseni etrafında döndür (açı radyan: **Radians**).
6. Eğriyi Rhino'da değiştir: kanatlar dalgalanır.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Attractor'un dört adımını (ölç, normalle, şekillendir, uygula) biliyorum.
- [ ] Bounds ve Remap Numbers ile değerleri istediğim aralığa taşıyabiliyorum.
- [ ] Graph Mapper ile değişimin karakterini kontrol edebiliyorum.
- [ ] Çekici noktaya göre değişen perfore desen kurabiliyorum.
- [ ] İmalat sınırlarını (min delik, min köprü) tanımda kontrol edebiliyorum.
- [ ] Eğriye uzaklığa göre dönen güneş kırıcılar yapabiliyorum.

**Bonus:** İki çekici kullan: her öğe için iki uzaklığı **Minimum** ile birleştir. Ya da delik çaplarını üç standart zımba ölçüsüne (10, 20, 30 mm) yuvarla; imalatçı sadece üç zımbayla keser.
