## Hedef

Gün sonunda tasarım seçeneklerini sayılarla karşılaştırabilecek, bir hedefi en iyi sağlayan değerleri Galapagos ile otomatik arayabileceksin. Panel tiplerini azaltmayı ve güneşe göre kanat açısı aramayı deneyeceksin. Süre yaklaşık 5 saat. Dosya: `Gun6_Analiz.gh`.

Parametrik tasarımın asıl kazancı, bir tasarımı değil yüzlerce varyasyonu denemektir. Bunun için her varyasyonun bir **puanı** olmalı.

## 1. Ölçmek: tasarım puanları (1 saat)

Bir cephe tanımında sık kullanılan ölçütler:

| Ölçüt | Nasıl hesaplanır |
| --- | --- |
| Panel adedi | List Length |
| Panel tipi sayısı | Round + Create Set (4. gün) |
| En büyük warp | Plane Closest Point + Bounds (4. gün) |
| Toplam cam alanı | Area + Mass Addition |
| Güneşe dönük alan | Panel normali ile güneş vektörünün açısı × alan |

1. 4. günün tanımını aç ve bu ölçütleri tek bir grupta topla: `Puanlar`.
2. Her ölçütü bir **Panel**'de göster. Tasarım değiştikçe sayıları izle.
3. **Data Recorder**: bir değeri her değişiklikte kaydeder. Slider'ı oynatırken panel tipi sayısının nasıl değiştiğini kaydet.

## 2. Panel tipi azaltma (1,5 saat)

Hedef: Kavisli cephede panel genişliklerini küçük toleranslarla eşitleyerek tip sayısını düşürmek.

1. Her panelin genişliğini hesapla, sırala ve **Panel**'de gör: kavis yüzünden hepsi birkaç mm farklıdır.
2. Yuvarlama adımını bir slider'a bağla: `Adim` = 1, 5, 10, 25 mm.
3. Genişlikleri bu adıma yuvarla, **Create Set** ile tip sayısını oku.
4. Adım büyüdükçe tip sayısı düşer, ama derz genişlikleri değişir. Derz farkını (gerçek genişlik - yuvarlanmış genişlik) hesapla ve en büyüğünü göster.
5. Kabul edilebilir derz toleransı (ör. ±5 mm) içindeki en büyük adımı seç.

@fig:tip_azaltma

## 3. Galapagos ile arama (1,5 saat)

Galapagos, slider'ları (gen) değiştirerek bir sayıyı (fitness) en büyük ya da en küçük yapan değerleri arar.

@fig:galapagos

**Alıştırma: güneşe göre kanat açısı**

1. 5. günün güneş kırıcı kanatlarını kullan, ama bu kez tüm kanatlar aynı açıda dönsün: slider `Aci` (0-90).
2. Güneş vektörü: Rhino'da bir çizgi çiz (güneşten cepheye), **Vector 2Pt** ile vektör al. Gerçek güneş konumu için Ladybug eklentisi kullanılabilir.
3. Cephe panellerine bakan güneş miktarı için basit bir ölçü: her cam panelin orta noktasından güneşe doğru bir ışın (**Line SDL**), kanatlarla **Brep | Line** kesişimi. Kesişen ışın = gölgede.
4. Puan: gölgede kalan cam panel oranı. Bu değer en büyük olsun.
5. Ama açı 90 olunca kanatlar cepheyi tamamen kapatır. İkinci bir ölçüt ekle: cepheye dik bakan bir görüş ışınının kanatlara çarpma oranı (manzara kaybı).
6. Fitness: `gölge oranı - 0,5 × manzara kaybı` (**Expression** ile).
7. **Galapagos** bileşenini koy: Genome girdisine `Aci` slider'ını, Fitness girdisine Expression çıkışını bağla. Çift tıkla, **Maximize**, **Start Solver**.
8. Galapagos farklı açıları dener, en iyi sonucu bulur. Bulunan açıyı uygulamak için sonuç listesinden **Reinstate** seç.

**Dikkat**

- Galapagos sonucu ancak puan tanımın kadar iyidir. Yanlış tanımlanmış bir fitness, matematiksel olarak doğru ama mimari olarak saçma sonuçlar verir.
- Çok sayıda gen ve yavaş bir tanımla arama saatler sürebilir. Önce tanımı hızlandır (önizlemeleri kapat, ağır bileşenleri devre dışı bırak).

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Bir tasarımı sayısal ölçütlerle değerlendirebiliyorum.
- [ ] Data Recorder ile değişimi kaydedebiliyorum.
- [ ] Yuvarlama adımıyla panel tipi sayısını ve derz farkını dengeleyebiliyorum.
- [ ] Gen ve fitness kavramlarını biliyorum.
- [ ] Galapagos ile bir slider'ı otomatik optimize edebiliyorum.

**Bonus:** Galapagos'a iki gen ver: `U_Adet` ve `V_Adet`. Fitness: panel tipi sayısını en az, en büyük warp'ı eşiğin altında tutsun (eşik aşılırsa puana büyük ceza ekle).
