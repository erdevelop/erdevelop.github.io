## Hedef ve SolidWorks mantığı

Gün sonunda tamamen tanımlı (fully defined) sketch'lerden oluşan, ölçüleri denklemlerle birbirine bağlı, oval delikli bir ankraj plakası parçan olacak. Süre yaklaşık 5 saat. Dosyayı `Ankraj_Plaka.SLDPRT` adıyla kaydet; sonraki günlerde kullanacaksın.

AutoCAD'den gelenler için en büyük fark şu: SolidWorks'te çizgiyi "doğru yere" çizmezsin. Kabaca çizer, sonra **ilişki** ve **ölçü** vererek yerini tanımlarsın. Değişiklik ölçüyle yapılır, model kendini günceller.

| Kavram | Anlamı | AutoCAD'deki karşılığı |
| --- | --- | --- |
| Sketch | Bir düzlem üzerindeki 2B çizim | Çizim, ama ölçüyle yönetilen |
| Relation (ilişki) | Yatay, dik, çakışık, eşit, simetrik gibi kurallar | Snap'in kalıcı hali |
| Feature | Sketch'ten üretilen 3B işlem (Extrude, Cut, Fillet) | Yok (EXTRUDE'a benzer ama geçmişi tutar) |
| FeatureManager | Parçanın adım adım yapım ağacı | Yok |
| Design intent | Parça değişince neyin sabit kalacağı kararı | Yok |

Kural: Sketch'i **siyah** (fully defined) bırakmadan feature'a geçme. Mavi çizgi tanımsız, kırmızı ya da sarı çizgi aşırı tanımlı demektir.

@fig:sw_renk

## 1. Hazırlık (30 dk)

1. SolidWorks'ü aç, **File > New > Part**.
2. **Tools > Options > Document Properties > Units**: **MMGS** (milimetre, gram, saniye) seç.
3. Ekranı tanı:
    - **FeatureManager** (sol): parçanın yapım ağacı. Origin ve üç düzlem (Front, Top, Right) burada.
    - **CommandManager** (üst): Features, Sketch, Evaluate sekmeleri.
    - **Heads-up View** (grafik alanının üstü): görünüm yönleri, görüntü stili, kesit görünüş.
4. İlk gün ezberlenecek kısayollar:

| Kısayol | İşlev |
| --- | --- |
| S | İmlecin yanında sık kullanılan komutlar (shortcut bar) |
| Boşluk tuşu | Görünüm yönü menüsü |
| Ctrl+8 | Seçili yüze dik bak (Normal To) |
| F | Zoom to fit |
| Ctrl+B / Ctrl+Q | Yeniden oluştur / zorla yeniden oluştur |
| Esc | Komuttan çık |
| Orta tuş sürükle | Döndür (Ctrl ile kaydır) |

Alışkanlık: Her sketch'i ve feature'ı ağaçta **yeniden adlandır** (F2). `Sketch7` yerine `Plaka_Dis_Kontur` yazan bir ağaç, iki hafta sonra seni kurtarır.

## 2. İlk sketch: plaka konturu (1 saat)

Hedef: 200 x 150 mm, köşeleri R10 yuvarlatılmış, origine göre simetrik bir dikdörtgen.

1. FeatureManager'da **Front Plane**'i seç, **Sketch** sekmesinden **Center Rectangle** aracını al. Merkezi origine tıkla, köşeyi rastgele bir yere tıkla.
2. **Smart Dimension** (D) ile genişliğe 200, yüksekliğe 150 ver. Çizgiler siyaha döner: sketch tamamen tanımlı.
3. **Sketch Fillet** ile dört köşeye R10 ver. Tek fillet ölçüsü dördünü yönetir.
4. Durum çubuğunda (sağ alt) **Fully Defined** yazdığını kontrol et.
5. Bilerek bozmayı dene: bir köşe noktasını sürükle. Hareket etmiyorsa tanım tamam demektir.

**Extrude**

1. Sketch açıkken **Features > Extruded Boss/Base**. Derinlik 10 mm, **Direction 1: Blind**.
2. Ağaçta `Boss-Extrude1`'i `Plaka` olarak adlandır, altındaki sketch'i `Plaka_Kontur` yap.
3. Sketch'e geri dönüp 200'ü 250 yap (sketch'e çift tıkla, ölçüyü değiştir, Ctrl+B). Model kendini günceller.

## 3. Oval delikler ve tasarım niyeti (1,5 saat)

Hedef: Plakada iki adet 14 x 30 mm yatay oval delik. Delikler hep plakanın kenarından 30 mm içeride ve birbirine göre simetrik kalsın.

1. Plakanın ön yüzünü seç, **Sketch**. Ctrl+8 ile yüze dik bak.
2. **Straight Slot** aracıyla sağ tarafa yatay bir oval delik çiz.
3. İlişkiler: oval deliğin merkez çizgisini seç, Ctrl ile origini de seç, **Horizontal** ilişkisi ver. Delik merkez hizasında kalır.
4. Sol tarafa ikinci oval deliği çiz. İki oval deliğin merkez noktalarını ve dikey merkez eksenini (geçici bir **Centerline** çizerek) seçip **Symmetric** ilişkisi ver.
5. Ölçüler: oval genişliği 14, merkezler arası boy 16 (toplam 30), oval delik ucu ile plaka kenarı arası 30.
6. Sketch siyah olunca **Extruded Cut**, **Through All**.
7. Ağaçta adlandır: `Oval_Delik`.

@fig:plaka

**Tasarım niyeti testi**

Plaka genişliğini 250'den 180'e indir. Delikler kenardan 30 mm içeride ve simetrik kalmalı. Kalmıyorsa ölçüyü yanlış yere vermişsin demektir: deliği origine değil kenara ölçülendir.

**Fillet ve pah**

1. **Features > Fillet**: plakanın 4 dik kenarına R2 (keskin kenar kırma).
2. Fillet'i her zaman ağacın sonuna yakın tut. Fillet'e dayanarak başka feature çizmek, ileride kırılan modellerin en sık sebebidir.

## 4. Denklemler ve global değişkenler (1 saat)

Ölçüleri birbirine bağlamak SolidWorks'ün asıl gücü. Grasshopper bilenler için bu, slider ve formül mantığının parça içindeki karşılığı.

1. **Tools > Equations** aç. **Global Variables** bölümüne ekle:

| Değişken | Değer | Anlamı |
| --- | --- | --- |
| `"Genislik"` | 200 | Plaka genişliği |
| `"Yukseklik"` | 150 | Plaka yüksekliği |
| `"Kalinlik"` | 10 | Plaka kalınlığı |
| `"Kenar_Mesafe"` | `"Kalinlik" * 3` | Delik kenar mesafesi, kalınlıkla büyür |

2. Sketch ölçüsüne çift tıkla, değer kutusuna `=` yazıp listeden global değişkeni seç. Genişlik, yükseklik, extrude derinliği ve kenar mesafesini bağla.
3. Ölçülerin yanında **Σ** işareti görünür: bu ölçü artık denklemle yönetiliyor.
4. Equations penceresinde `"Kalinlik"` değerini 15 yap. Plaka kalınlaşır, delikler kenardan 45 mm içeri kayar.

**Malzeme ve kütle**

1. Ağaçta **Material**'e sağ tıkla, **Edit Material**: Steel > **S235** yoksa **Plain Carbon Steel** seç.
2. **Evaluate > Mass Properties** ile kütleyi gör. Kalınlığı değiştirip kütlenin güncellendiğini kontrol et.

## 5. Kontrol ve kayıt (45 dk)

1. **Evaluate > Measure** ile iki delik arası mesafeyi ölç ve ölçülerinle karşılaştır.
2. Ağacın en altındaki **Rollback bar**'ı (mavi çizgi) Oval_Delik'in üstüne sürükle. Model o adıma geri döner. Böylece parçanın nasıl yapıldığını adım adım görürsün. Sonra en alta geri sürükle.
3. **File > Properties > Custom** sekmesinde `Description` = `Ankraj plakası`, `Malzeme` = malzeme adı ekle. 6. günde teknik resim bunları okuyacak.
4. Kaydet: `Ankraj_Plaka.SLDPRT`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Sketch rengine bakarak tanımlı, tanımsız ve aşırı tanımlıyı ayırt edebiliyorum.
- [ ] İlişki (Horizontal, Symmetric, Coincident) ile ölçünün farkını biliyorum.
- [ ] Plaka ölçüsü değişince deliklerin nasıl davranacağını önceden belirleyebiliyorum.
- [ ] Extrude, Extruded Cut ve Fillet kullanabiliyorum.
- [ ] Global değişken tanımlayıp ölçülere bağlayabiliyorum.
- [ ] Malzeme verip kütleyi okuyabiliyorum.
- [ ] Ağaçtaki feature'ları anlamlı adlarla adlandırıyorum.

**Bonus:** Oval delik sayısını parametrik yap. Deliği **Linear Pattern** ile çoğalt, adet ve aralığı global değişkene bağla. `"Genislik"` büyüdükçe adedin otomatik artması için `IIF("Genislik" > 300, 3, 2)` gibi bir koşullu denklem dene.
