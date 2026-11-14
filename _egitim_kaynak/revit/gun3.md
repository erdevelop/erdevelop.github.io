## Hedef ve Family Editor mantığı

Gün sonunda genişlik, yükseklik, derinlik ve kalınlığı parametrik, delikli bir L ankraj braketi ailen olacak. Ailenin 3 tipi olacak ve cepheye yerleştirilmiş olacak. Süre yaklaşık 5 saat. Revit öğreniminin en önemli günü bu.

SolidWorks'teki mantığa çok benzer, tek fark şu:

| SolidWorks | Revit Family Editor |
| --- | --- |
| Sketch'i ölçüyle tanımla | Geometriyi **referans düzlemlerine** kilitle, ölçüyü düzlemler arasına koy |
| Global variable / equation | Etiketli ölçü + **Family Types** içinde formül |
| Configuration | Family type |
| Feature suppress | Yes/No parametresiyle **Visible** |

Altın kural: Önce referans düzlemlerini kur ve onları oynat. Geometriyi sonra çiz ve düzlemlere kilitle. Ölçüyü doğrudan geometriye koymak ileride kırılan aileler üretir.

## 1. Şablon ve referans düzlemleri (1 saat)

**Şablon**

1. **File > New > Family**, şablon `Metric Generic Model.rft`. Host'suz bir aile, her yere yerleştirilebilir.
2. `Ankraj_L_Braket.rfa` olarak hemen kaydet.
3. Şablonda iki merkez düzlem hazır gelir. **Center (Left/Right)** braketin simetri ekseni, **Center (Front/Back)** ise braketin döşemeye ya da beton yüzüne dayandığı arka yüz olacak. Ailenin ekleme noktası bu ikisinin kesişimi.

**Plan görünüşünde düzlemler (Ref. Level)**

1. **Create > Reference Plane** (RP) ile merkezin solunda ve sağında birer dikey düzlem çiz. Properties'te adlarını `Sol` ve `Sag` yap, **Is Reference** değerlerini Left ve Right seç.
2. Sol, merkez ve Sağ arasına zincir ölçü koy, **EQ** bas.
3. Sol ile Sağ arasına tek ölçü koy, ölçüyü seç, ribbon'da **Label > Create Parameter**. Ad `Genislik`, **Type** parametresi, değer 150.
4. Arka yüzden öne doğru iki yatay düzlem daha çiz:
    - `On`: arka yüzden `Derinlik` kadar önde (Is Reference: Front), değer 120.
    - `Dik_Levha`: arka yüzden `Kalinlik` kadar önde, değer 8.

@fig:braket_plan

**Front görünüşünde düzlemler**

1. **Elevations > Front** aç. Taban çizgisi Ref. Level.
2. `Ust` düzlemi: Ref. Level'dan `Yukseklik` kadar yukarıda (Is Reference: Top), değer 150.
3. `Taban_Levha`: Ref. Level'dan `Kalinlik` kadar yukarıda. Yeni parametre açma, etiket listesinden mevcut `Kalinlik`'i seç.

**İlk flex testi (geometri yokken)**

**Create > Family Types** aç. Genislik, Derinlik, Yukseklik ve Kalinlik değerlerini değiştir, **Apply** de. Düzlemlerin doğru yöne kaydığını gör. Bir düzlem ters gidiyorsa ölçüyü sil ve hangi düzlemin sabit kalacağını düşünerek yeniden koy.

## 2. Geometri: iki levhalı L braket (1 saat)

Braket iki ayrı extrusion'dan oluşacak: düz taban levhası ve arka yüzdeki dik levha. İkisi de planda çizilir, yüksekliği Front görünüşünde düzleme kilitlenir.

**Taban levhası**

1. Ref. Level planında **Create > Extrusion**, çizim aracı **Rectangle**.
2. Dikdörtgeni Sol, Sağ, arka yüz ve On düzlemlerinin üzerine çiz. Çizer çizmez çıkan 4 kilit simgesine tıkla.
3. Properties: Extrusion Start = 0, Extrusion End = 8. **Finish** (yeşil tik).
4. Front görünüşüne geç. **AL** ile önce `Taban_Levha` düzlemine, sonra levhanın üst yüzüne tıkla ve kilidi kapat.

**Dik levha**

1. Planı aç, yeni Extrusion başlat. Dikdörtgen: Sol, Sağ, arka yüz ve `Dik_Levha` düzlemleri. 4 kilidi kapat.
2. Finish. Front görünüşünde üst yüzü `Ust` düzlemine AL ile hizala ve kilitle.
3. **Modify > Join** ile iki levhayı birleştir, köşedeki çakışma temizlenir.

**Flex testi**

Family Types'ta sırayla dene: Genislik 100 / 250, Derinlik 80 / 200, Yukseklik 100 / 300, Kalinlik 5 / 15. Her seferinde Apply de ve 3D'de kontrol et.

- *Constraints are not satisfied* hatası: bir kenar kilitli değil ya da yanlış düzleme kilitli. Extrusion'ı seç, **Edit Extrusion** ile sketch'e gir ve kilitleri kontrol et.
- Bir kenar yerinde kalıyorsa o kenarın kilidi eksik.

Flex testini geçmeyen aileyle devam etme. Sonraki adımlardaki tüm sorunlar buradan çıkar.

## 3. Delik, formüller, takviye, malzeme ve tipler (1,5 saat)

**Bulon deliği (void)**

1. Planda arka yüze paralel bir düzlem çiz: `Delik_Ekseni`. Arka yüzle arasına ölçü koy, parametre `Delik_Mesafe`.
2. **Create > Void Forms > Void Extrusion**, Circle aracı. Merkezi Delik_Ekseni ile Center (Left/Right) kesişimine koy.
3. Daireyi seç, Properties'te **Center Mark Visible** aç. AL ile merkez işaretini iki düzleme de kilitle.
4. Yarıçap ölçüsünü koy, parametre `Delik_R`.
5. Extrusion Start = 0, End = 50. Finish. Void taban levhasını kesmezse **Modify > Cut** ile kestir.

**Formüller** (Family Types penceresi, Formula sütunu)

| Parametre | Tip | Formül | Anlamı |
| --- | --- | --- | --- |
| Delik_Mesafe | Length | `(Derinlik + Kalinlik) / 2` | Delik serbest kolun ortasında |
| Delik_Cap | Length (yeni) | `if(Genislik > 150 mm, 14 mm, 11 mm)` | Geniş brakette M12, dar brakette M10 |
| Delik_R | Length | `Delik_Cap / 2` | Daire yarıçapı çapa bağlı |
| Takviye_Var | Yes/No (yeni) | `Yukseklik > 200 mm` | Uzun brakete otomatik takviye |

Formüllerde birim yazmayı unutma (`150 mm`). Birimsiz sayı karşılaştırması hata verir.

**Takviye kanadı (Yes/No ile görünürlük)**

1. **Elevations > Right** aç. Work plane olarak `Sol` düzlemini seç. Kanat braketin kenarında olacak, ortadaki bulon deliğiyle çakışmayacak.
2. Extrusion ile üçgen çiz: köşeler Dik_Levha/Taban_Levha kesişimi, On/Taban_Levha kesişimi ve Dik_Levha/Ust kesişimi. Yatay ve dikey kenarları düzlemlere kilitle.
3. Extrusion Start = 0, End: yanındaki küçük düğmeyle (Associate Family Parameter) `Kalinlik`'e bağla. Kanat braketin dışına taşarsa sil, work plane olarak `Sag` düzlemini seçip tekrar çiz. Biri mutlaka içe doğru çıkar.
4. Properties > **Visible** yanındaki düğmeyle `Takviye_Var`'a bağla. Yukseklik'i 150 ve 250 yaparak kanadın kendiliğinden gelip gittiğini gör.

@fig:braket_yan

Not: Void'lerin Visible parametresi yoktur, bu yüzden Yes/No'yu solid bir parça üzerinde öğreniyoruz.

**Malzeme**

Üç solid'i birlikte seç, Properties > Material yanındaki düğmeyle yeni bir Type parametresi oluştur: `Malzeme`. Varsayılan olarak bir galvaniz çelik malzemesi ata.

**Tipler** (Family Types > New Type)

| Tip | Genislik | Yukseklik | Derinlik | Kalinlik |
| --- | --- | --- | --- | --- |
| B100 | 100 | 100 | 120 | 8 |
| B150 | 150 | 150 | 120 | 10 |
| B200 | 200 | 250 | 150 | 12 |

Her tipi seçip Apply de. B200'de takviyenin göründüğünü ve delik çapının 14 mm olduğunu kontrol et.

## 4. Detail level, projeye yükleme ve adet tablosu (1 saat)

**Detail level**

1. Takviye kanadını seç, Properties > **Visibility/Graphics Overrides > Edit**. **Coarse** kutusunu kaldır. Kanat sadece Medium ve Fine'da görünür.
2. Büyük koordinasyon modellerinde küçük detayları Coarse'ta gizlemek modeli hızlandırır. LOD 350'de Fine'da tam detay, Coarse'ta sade kutu iyi bir kural.

**Kimlik bilgileri**

1. **Create > Family Category and Parameters**: kategori Generic Models kalsın.
2. Family Types'ta **Description** = `Cephe ankraj braketi`, **Model** = tip adı. Tabloda ve IFC'de bu alanlar görünür.
3. Aileyi kaydet.

**Projeye yükle ve yerleştir**

1. `Gun2_Cephe.rvt` açıkken aileden **Load into Project**.
2. Zemin Kat planında **Architecture > Component** (CM), tip B150. Braketi arka duvarın ön yüzüne, 1. aksa yerleştir. Space ile döndürebilirsin.
3. Braketi seçip **Copy** ile her dikme ekseninde bir tane olacak şekilde çoğalt (1500 mm aralık). Aynısını 1. Kat için de yap.
4. Birkaç braketi Type Selector'dan B200 yap.

**Aileyi projeden düzenle**

1. Bir brakete sağ tıkla, **Edit Family**. B150 tipinin Kalinlik değerini 12 yap.
2. **Load into Project and Close**, sorulunca **Overwrite the existing version and its parameter values** seç.
3. Projedeki tüm B150'lerin güncellendiğini gör.

**Adet tablosu**

1. Yeni schedule, kategori **Generic Models**, ad `Ankraj Listesi`.
2. Alanlar: Type, Description, Level, Count. Type'a göre grupla, Itemize every instance kapalı.
3. Bir B150'yi B200 yap ve tablodaki adetlerin anında değiştiğini gör.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne, yani panel ailelerine hazırsın.

- [ ] Geometriyi ölçüye değil referans düzlemlerine neden bağladığımı anlatabiliyorum.
- [ ] Etiketli ölçüden Type parametresi oluşturabiliyorum.
- [ ] Sketch kenarlarını kilitleyip flex testinden geçirebiliyorum.
- [ ] Birimli formül ve if() yazabiliyorum.
- [ ] Yes/No parametresiyle bir parçayı gizleyip gösterebiliyorum.
- [ ] Malzemeyi ve detail level görünürlüğünü parametreye bağlayabiliyorum.
- [ ] Aileyi projede güncelleyip adet tablosu çıkarabiliyorum.

**Bonus:** Yuvarlak deliği oval kanala çevir. İki yarım daire ve iki düz çizgiden oluşan bir void çiz, kanal boyunu `Kanal_Boy` parametresine bağla. Cephede tolerans almak için gerçek braketlerde bu şekilde yapılır.
