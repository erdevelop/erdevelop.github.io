## Hedef

Gün sonunda planda kavisli, yukarıda öne doğru eğilen bir cephe yüzeyin ve ona teğet bağlanan bir saçak (kanopi) yüzeyin olacak. Yüzeylerin birbirine ne kadar düzgün bağlandığını analiz araçlarıyla kontrol etmeyi öğreneceksin. Süre yaklaşık 5 saat. Dosya: `Gun2_Yuzey.3dm`.

## 1. Yüzey üretme komutları (1,5 saat)

| Komut | Girdi | Kullanım |
| --- | --- | --- |
| ExtrudeCrv | Bir eğri + yön | Düz ya da kavisli dik cephe |
| Loft | Sıralı kesit eğrileri | Kesitten kesite değişen cephe |
| Sweep1 | 1 ray + kesitler | Bir yol boyunca kesit süpürme (kanopi, söve) |
| Sweep2 | 2 ray + kesitler | İki kenar eğrisi arasında yüzey |
| NetworkSrf | İki yönde eğri ağı | Serbest form, en kontrollü yüzey |
| Revolve / RailRevolve | Eğri + eksen | Dönel yüzey (kolon kaplaması) |
| PlanarSrf / EdgeSrf | Kapalı düz eğri / 2-4 kenar | Basit kapama yüzeyleri |

@fig:yuzey_komut

**Alıştırma: dört yöntemle cephe**

1. Top görünüşünde **Arc** ile 12 m kirişli, 1,5 m sehimli bir yay çiz: cephenin plan çizgisi.
2. **ExtrudeCrv**, 8000 mm yukarı. Dik kavisli cephe hazır. `Yuzey_Extrude` katmanına koy.
3. Yayı kopyala, 8000 mm yukarı taşı ve **Scale1D** ile kirişini 10 m'ye indir. Alt ve üst yaydan **Loft**: yukarıda daralan cephe.
4. Üst yayı 1000 mm öne taşı ve tekrar Loft: öne eğilen cephe. Loft seçeneklerinden **Normal** ve **Straight sections**'ı karşılaştır.
5. İki yay ve iki yan kenar eğrisiyle **NetworkSrf**. Toleransları varsayılan bırak.
6. Dördünü yan yana koy, **Isocurve density** (Properties) ile yüzey çizgilerini gör.

## 2. Kontrol noktalarıyla düzenleme (1 saat)

1. Loft yüzeyini seç, **PointsOn**. Kontrol noktaları ızgara gibi görünür.
2. Bir sıra noktayı seç (**SelU** / **SelV** ya da pencereyle) ve **Gumball** ile öne çek. Yüzey yumuşakça değişir.
3. Nokta sayısı çok fazlaysa yüzey dalgalanır. **Rebuild** ile U ve V yönünde nokta sayısını azalt (ör. 6 x 4, derece 3). Önce ve sonra yüzey sapmasını komut satırında oku.
4. **Smooth** ile seçili noktaları yumuşat.

Kural: Az kontrol noktası, sakin yüzey. Cephe gibi büyük ve göz önündeki yüzeylerde yüzeyi gerektiğinden fazla noktayla üretme.

## 3. Süreklilik: G0, G1, G2 (1,5 saat)

| Seviye | Anlamı | Görsel |
| --- | --- | --- |
| G0 (konum) | Kenarlar birleşiyor ama kırık | Keskin köşe |
| G1 (teğet) | Kenarlar aynı yönde birleşiyor | Yumuşak ama ışık kırılır |
| G2 (eğrilik) | Eğrilik de sürekli | Işık kesintisiz akar |

@fig:sureklilik

**Alıştırma: kanopi**

1. Kavisli cephenin üst kenarından öne doğru 2,5 m'lik bir saçak yap: cephenin üst kenarını **DupEdge** ile kopyala, öne ve hafif yukarı taşı, iki eğri arasında **Loft**.
2. Cephe ile saçak arasında kırık bir köşe oluştu (G0).
3. **BlendSrf**: cephe üst kenarı ve saçak arka kenarı. Süreklilik seçeneklerinde önce **Tangency** (G1), sonra **Curvature** (G2) dene.
4. Alternatif: **MatchSrf** ile saçak kenarını doğrudan cephe kenarına G1/G2 olarak eşitle.

**Analiz**

1. **Zebra**: yüzeylere siyah-beyaz şeritler yansıtır. Şeritler birleşimde kırılıyorsa G0, yön değiştirmeden ama köşeli devam ediyorsa G1, akarak devam ediyorsa G2.
2. **CurvatureAnalysis** ile Gaussian eğriliği renk haritasıyla gör. Panelleme yaparken düz (sıfır eğrilik) ve çift eğrilikli bölgeleri ayırmak için önemli.
3. **EMap** ile yansıma kontrolü yap. Cam cephelerde dalgalı yansıma bu analizde hemen görünür.
4. **GCon** ile iki eğrinin birleşim sürekliliğini sayısal olarak ölç.

## 4. Yüzey düzenleme (45 dk)

| Komut | İşlev |
| --- | --- |
| Trim / Split | Yüzeyi eğri ya da başka yüzeyle kırp / böl |
| ExtendSrf | Yüzey kenarını uzat |
| Dir | Yüzey normal yönünü göster ve çevir |
| ShrinkTrimmedSrf | Kırpılmış yüzeyin altındaki fazla yüzeyi küçült |
| Join | Yüzeyleri polysurface olarak birleştir |

1. Cephenin alt 500 mm'sini zemin hizasından **Split** ile ayır: süpürgelik bölgesi.
2. **Dir** ile cephe yüzeyinin normalinin dışa baktığını kontrol et; içe bakıyorsa çevir. Panelleme ve kalınlık verme (offset) işlemleri bu yöne göre çalışır.
3. Cephe ve saçağı **Join** ile birleştir.

Kaydet: `Gun2_Yuzey.3dm`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] ExtrudeCrv, Loft, Sweep ve NetworkSrf arasında ne zaman hangisini seçeceğimi biliyorum.
- [ ] Kontrol noktalarıyla yüzeyi düzenleyip Rebuild ile sadeleştirebiliyorum.
- [ ] G0, G1 ve G2 farkını anlatabiliyorum.
- [ ] BlendSrf ya da MatchSrf ile yüzeyleri istediğim süreklilikte bağlayabiliyorum.
- [ ] Zebra, CurvatureAnalysis ve EMap ile yüzey kalitesini kontrol edebiliyorum.
- [ ] Dir ile yüzey normalini kontrol edip çevirebiliyorum.

**Bonus:** Aynı kanopiyi **Sweep2** ile yap: rayları cephe üst kenarı ve saçak ön kenarı, kesitleri birkaç farklı eğim çizgisi olsun. Loft ile çıkan yüzeyi Zebra'da karşılaştır.
