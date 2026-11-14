## Hedef

Gün sonunda 2. günün eğrisel cephe yüzeyi kat ve aks hatlarıyla panellere bölünmüş, paneller bloklar halinde yerleştirilmiş, panel sayıları ve açınımları çıkarılmış olacak. Büyük modelleri katmanlar, bloklar ve worksession ile yönetmeyi öğreneceksin. Süre yaklaşık 5 saat. Dosya: `Gun4_Panel.3dm`.

## 1. Model düzeni (1 saat)

**Katman yapısı**

Büyük cephe modellerinde katmanlar alt katmanlarla düzenlenir. Örnek:

| Üst katman | Alt katmanlar |
| --- | --- |
| 00_Referans | Aks, Kot, Mimari_Import |
| 10_Yuzey | Cephe_Yuzey, Kanopi |
| 20_Panel | Cam, Spandrel, Kaset |
| 30_Tasiyici | Dikme, Kayit, Braket |
| 90_Cizim | Olcu, Yazi, Pafta |

1. Bu yapıyı Layers panelinde kur. Alt katman oluşturmak için katmana sağ tıkla, **New Sublayer**.
2. Bir üst katmanı kapatınca tüm alt katmanlar kapanır. Çalışırken yalnızca ilgili katmanı açık tut.
3. **Named CPlanes** ve **Named Views** ile cephe yüzlerine göre çalışma düzlemleri ve görünüşler kaydet: `CPlane_KuzeyCephe`, `Gorunus_Kuzey`.

**Worksession**

Büyük projelerde mimari model, taşıyıcı model ve cephe modeli ayrı dosyalarda tutulur. **Worksession** ile başka dosyaları referans olarak (değiştirmeden) yüklersin. Bir dosya üzerinde aynı anda yalnızca bir kişi çalışır, diğerleri o dosyayı referans olarak görür.

## 2. Yüzeyi bölme (1,5 saat)

Hedef: Cephe yüzeyini her katta (4000 mm) ve her 1500 mm'de bölmek.

1. **Contour** ile cephe yüzeyini yatay olarak kes: taban noktası zemin, yön yukarı, aralık 4000. Kat hatları oluşur.
2. Düşey bölme için: Top görünüşünde cephenin plan yayını **Divide** ile 1500 mm aralıkla böl (seçenekten **Length**). Noktalardan geçen düşey çizgileri yüzeye **Project** et ya da noktalarda dik düzlemlerle **Intersect** yap.
3. Yüzeyi bu eğrilerle **Split** et. Her parça bir panel olur.
4. Panelleri `20_Panel > Cam` katmanına taşı. **SelLayer** ve komut satırındaki seçili nesne sayısıyla panel sayısını oku.
5. Spandrel hattının altında kalan panelleri seç ve `Spandrel` katmanına taşı.

@fig:panelleme

**Panel ölçüleri**

1. Bir panel seç ve **BoundingBox** ile çevreleyen kutuyu al; panel genişlik ve yüksekliğini oku.
2. **Area** ile tüm panellerin toplam alanını hesapla.
3. Kenar paneller ara panellerden farklı genişlikte çıkar. Bunlar özel ölçülü panellerdir ve imalat listesinde ayrı tutulur.

## 3. Bloklar (1 saat)

Aynı nesne çok kez kullanılıyorsa blok yapılır. Model hafifler, birini değiştirince hepsi değişir.

1. 3. günün ankraj braketini bu dosyaya **Import** et.
2. **Block** komutu: braketi seç, ekleme noktası olarak braketin arka yüz alt orta noktasını seç. Adı `BR-150`.
3. Her kat hattının, her düşey bölme çizgisiyle kesiştiği noktaya braket yerleştir. Noktaları **Intersect** ile bul, **Insert** ile bloğu yerleştir ya da **OrientOnSrf** ile yüzeye dik olarak oturt.
4. **BlockManager** aç: `BR-150` bloğunun kaç kez kullanıldığını (instance count) gör. Bu, braket adedidir.
5. **BlockEdit** ile bloğa gir, braket kalınlığını değiştir. Tüm braketler birlikte güncellenir.
6. Blok dış dosyadan da bağlanabilir (**linked block**). Firma standart parçaları için bu yöntem önerilir: kütüphanedeki dosya değişince tüm projeler günceller.

## 4. Açınım ve imalat çıktısı (1 saat)

1. Tek eğrilikli (silindirik) bir panel seç ve **UnrollSrf** ile düz hale getir. Sac kaset panellerin açınımı bu şekilde çıkar.
2. Çift eğrilikli bir panel UnrollSrf ile açılmaz; **Squish** ile yaklaşık açınım alınır, ama bu bir tahmindir. Böyle paneller için gerçek imalat yöntemini (soğuk büküm, kalıp) imalatçıyla konuşmak gerekir.
3. Açınımları düz bir alanda yan yana diz ve her birine **Text** ile panel numarası yaz.
4. **Export Selected** ile DXF olarak kaydet. Export şemasında çizgileri polyline olarak ve 1:1 ölçekte ver.

@fig:acinim

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne, yani Grasshopper'a geçebilirsin.

- [ ] Büyük modeli alt katmanlarla düzenleyebiliyorum.
- [ ] Named CPlane ve Named View kaydedebiliyorum.
- [ ] Contour, Divide ve Split ile yüzeyi panellere bölebiliyorum.
- [ ] Panel adedini ve toplam alanı okuyabiliyorum.
- [ ] Blok oluşturup yerleştirebiliyor, adedini BlockManager'dan okuyabiliyorum.
- [ ] UnrollSrf ile tek eğrilikli panelin açınımını alıp DXF'e aktarabiliyorum.

**Bonus:** Tüm bu bölme işini elle yaptın. Aks aralığı 1500'den 1250'ye değişirse neleri baştan yapman gerektiğini listele. Bu liste, yarın Grasshopper'ı neden öğrendiğimizin cevabı.
