## Hedef

Gün sonunda DWG kesitinden üretilmiş bir alüminyum profil parçan olacak. Bu parçanın 5 farklı boyu Excel tablosundan yönetilecek, her boyun ağırlığı ve kodu otomatik hesaplanacak. Süre yaklaşık 5 saat.

Başlamadan önce: Elinde bir alüminyum profil kesiti DWG'si olsun. İçinde sadece kesit konturu olmalı (ölçü, tarama ve yazı olmadan). Bilgisayarında Excel kurulu olmalı; design table için gerekiyor.

## 1. DWG kesitten sketch (1,5 saat)

**İçe aktar**

1. **File > Open**, dosya türünü DWG seç, kesit dosyasını aç.
2. DXF/DWG Import sihirbazında **Import to a new part as 2D sketch** seç.
3. Birim: milimetre. Katmanlardan sadece kesit konturunu bırak.
4. Sihirbaz sonunda sketch'in hangi düzleme yerleşeceğini sorar: **Front Plane**.

**Temizle ve konumla**

1. Sketch'i düzenle. **Tools > Sketch Tools > Check Sketch for Feature** ile açık uç ve üst üste çizgi kontrolü yap.
2. Kontur kapalı değilse açık uçları bul ve **Trim/Extend** ile kapat. Üst üste binen kısa çizgileri sil.
3. Profilin bir referans noktasını (ör. dış yüzün köşesi ya da vida kanalı merkezi) origine **Coincident** ile bağla.
4. Bir dış kenarı seçip **Horizontal** ver. Kesit artık dönmez, yeri belli.
5. Import edilen sketch çok sayıda serbest nokta içerir; tam tanımlı yapmak zorunda değilsin. Ama yeri (origin ve yön) mutlaka sabit olmalı. Bunun için gerekirse **Fix** ilişkisi kullan.

**Profil gövdesi**

1. **Extruded Boss/Base**, **Direction 1: Blind**, 1000 mm.
2. Ağaçta adlandır: `Profil_Kesit` ve `Profil_Boy`.
3. **Edit Material**: **Aluminum Alloys > 6063-T6**.
4. **Evaluate > Mass Properties**: 1000 mm için kütleyi oku. Bu sayı profil kataloğundaki kg/m değeriyle tutmalı. Tutmuyorsa kesit yanlış ölçekte ya da açık konturlu demektir.

## 2. Konfigürasyonlar (1 saat)

Konfigürasyon, aynı dosyada bir parçanın birden fazla varyantını tutar. Her varyantı ayrı dosya olarak kaydetme alışkanlığının yerini alır.

1. Sol paneldeki **ConfigurationManager** sekmesine geç.
2. Parça adına sağ tıkla, **Add Configuration**: `L1000`.
3. Bir tane daha ekle: `L2500`. Bu konfigürasyon aktifken boy ölçüsüne çift tıkla, değeri 2500 yap ve değer kutusunun yanındaki menüden **This Configuration** seç.
4. İki konfigürasyon arasında geçiş yap (çift tıklayarak). Boyun değiştiğini gör.
5. Uyarı: Bu menüde **All Configurations** seçersen değişiklik tüm konfigürasyonlara gider. Konfigürasyonlarla ilgili hataların çoğu bu seçimden çıkar.

## 3. Design table: boyları Excel'den yönet (1,5 saat)

Elle konfigürasyon eklemek 3-4 varyantta yeter. Daha fazlası için tablo kullanılır.

1. Önce boy ölçüsünü anlamlı adlandır: ölçüye tıkla, Properties'te adı `Boy` yap. Tam adı `Boy@Profil_Boy` olur.
2. **Insert > Tables > Design Table**, **Auto-create**. Sorulduğunda `Boy@Profil_Boy` ölçüsünü seç.
3. SolidWorks içinde bir Excel tablosu açılır. Satırlar konfigürasyon, sütunlar parametredir. Doldur:

| (konfigürasyon) | Boy@Profil_Boy | $PRP@Profil_Kodu | $PRP@Description |
| --- | --- | --- | --- |
| L1000 | 1000 | AL-01 | Dikme profili 1000 |
| L2500 | 2500 | AL-01 | Dikme profili 2500 |
| L3000 | 3000 | AL-01 | Dikme profili 3000 |
| L4000 | 4000 | AL-01 | Dikme profili 4000 |
| L6000 | 6000 | AL-01 | Dikme profili 6000 |

4. Tablo dışına tıkla. SolidWorks yeni konfigürasyonları oluşturduğunu bildirir.
5. `$PRP@özellik_adı` sütunları konfigürasyona özel özellik (custom property) yazar. Teknik resim ve BOM bunları okur.
6. Tabloyu düzenlemek için ConfigurationManager'da **Tables > Design Table**'a sağ tıkla, **Edit Table**.

@fig:design_table

## 4. Otomatik ağırlık ve özellikler (45 dk)

1. **File > Properties > Configuration Specific** sekmesine geç.
2. Yeni özellik: `Agirlik`, değer kutusundaki listeden **Mass** seç. Değer `"SW-Mass@..."` gibi bir bağlantı olur ve kütle değişince kendisi güncellenir.
3. Bir özellik daha: `Boy`. Değer kutusu aktifken grafik alanında boy ölçüsüne tıkla; ölçü bağlantısı otomatik yazılır.
4. Konfigürasyonlar arasında geç ve Agirlik değerinin değiştiğini kontrol et.
5. **Custom** sekmesine (tüm konfigürasyonlar için ortak) `Malzeme` = `6063-T6`, `Yuzey` = `Eloksal` ekle.

@fig:ozellik_akis

**Neden önemli?** 6. günde teknik resimdeki antet ve malzeme listesi bu alanları doğrudan okuyacak. Bilgiyi bir kez parçaya yazarsın, her paftada doğru çıkar.

## 5. Kesit kontrolü (15 dk)

1. **Heads-up View > Section View** ile profili kes, iç kanalları kontrol et.
2. **Evaluate > Section Properties**: kesit yüzeyini seç. Alan ve atalet momentlerini (Ix, Iy) oku. Statik hesap yapan biri senden bu değerleri isteyecek.
3. Kaydet: `Profil_AL-01.SLDPRT`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne, yani sac metale geçebilirsin.

- [ ] DWG kesiti 2B sketch olarak içe aktarıp temizleyebiliyorum.
- [ ] Kontur hatalarını Check Sketch for Feature ile bulabiliyorum.
- [ ] Profil kütlesini kataloğun kg/m değeriyle karşılaştırabiliyorum.
- [ ] This Configuration ile All Configurations farkını biliyorum.
- [ ] Design table ile konfigürasyon ve özellik üretebiliyorum.
- [ ] Ağırlığı kütleye bağlı otomatik özellik olarak yazabiliyorum.
- [ ] Section Properties ile kesit değerlerini okuyabiliyorum.

**Bonus:** Design table'a bir `$STATE@Delik_Pattern` sütunu ekle ve bazı konfigürasyonlarda delik pattern'ını **S** (suppressed) yap. Aynı profilin delikli ve deliksiz varyantlarını tek tablodan yönet.
