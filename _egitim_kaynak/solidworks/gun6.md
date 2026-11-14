## Hedef

Gün sonunda kendi antetli şablonun, bir parça imalat paftası, açınımlı bir sac paftası, kesim listeli bir konstrüksiyon paftası ve malzeme listeli (BOM) bir montaj paftası olacak. Antetler bilgileri modeldeki özelliklerden otomatik okuyacak. Süre yaklaşık 5 saat.

SolidWorks'te teknik resim modelden türetilir. Modelde bir ölçü değişince pafta da değişir. Paftada çizgi çizmek yerine modeli düzeltmek bu yüzden doğru alışkanlıktır.

## 1. Pafta şablonu ve antet (1,5 saat)

1. **File > New > Drawing**, A3 yatay sayfa formatıyla başla.
2. Sayfaya sağ tıkla, **Edit Sheet Format**. Antet bu katmandadır.
3. Antetteki yazı kutularını kendi düzenine göre düzenle: Proje, Parça adı, Parça kodu, Malzeme, Ağırlık, Ölçek, Çizen, Tarih, Revizyon.
4. Her kutuyu modele bağla: yazıyı seç, **Link to Property** düğmesi, **Model found here** seçeneğiyle `Description`, `Profil_Kodu`, `Malzeme`, `Agirlik` gibi özellikleri seç. Yazı `$PRPSHEET:"Description"` biçimine dönüşür.
5. Ölçek ve sayfa adı için de sayfa özelliklerini bağla.
6. **Edit Sheet** ile normal moda dön.
7. **Tools > Options > Document Properties > Drafting Standard**: **ISO**. Ölçü yazı tipi ve ok ayarlarını kendi standardına göre yap.
8. Şablonu kaydet: **File > Save Sheet Format** ile antet (`.slddrt`), **File > Save As > Drawing Template** ile şablon (`.drwdot`). İkisini de **File Locations**'ta tanıtılan klasöre koy.

@fig:pafta

## 2. Parça paftası: ankraj plakası (1 saat)

1. Kendi şablonunla yeni pafta aç. **View Palette**'ten (sağ panel) plakanın **Front** ve **Right** görünüşlerini sürükle.
2. Antette Description, Malzeme ve Ağırlık'ın otomatik dolduğunu kontrol et.
3. **Annotation > Model Items**: Source **Entire model**, **Marked for drawing** ölçüler gelir. Modelde verdiğin ölçüler pafta ölçüsü olur.
4. Gereksiz ya da üst üste gelen ölçüleri sil ya da başka görünüşe taşı (Shift ile sürükle).
5. Oval delikler için **Hole Callout** ekle.
6. Plaka kalınlığını göstermek için **Section View** al.
7. Genel tolerans ve yüzey işlemi notunu **Note** ile ekle.

## 3. Sac panel paftası: açınım (45 dk)

1. Kaset paneli paftaya getir. View Palette'te **Flat pattern** görünüşü de vardır; onu ekle.
2. Açınım görünüşünde büküm çizgileri ve büküm notları (yön, açı, iç yarıçap) otomatik gelir.
3. **Annotation > Tables > Bend Table** ekle: her büküm için yön ve açı listelenir. Abkant operatörü bu tabloyu kullanır.
4. Açınımın dış ölçülerini ver. Bu ölçüler kesim ölçüsüdür.
5. Bükülü hali için de bir izometrik görünüş ekle.

## 4. Konstrüksiyon paftası: kesim listesi (45 dk)

1. 4. günün konsolunu paftaya getir: ön görünüş ve izometrik.
2. **Annotation > Tables > Weldment Cut List**. Tablo cut list özelliklerini okur: adet, açıklama, boy, açı.
3. Tablo sütunlarına sağ tıklayıp **LENGTH**, **ANGLE1**, **ANGLE2** ve **MATERIAL** sütunlarını ekle.
4. **Auto Balloon** ile her gövdeye tablo satır numarasını gösteren balon koy.
5. Kaynak işaretleri: **Weld Symbol** ile köşe kaynağını işaretle.

## 5. Montaj paftası: BOM ve balonlar (45 dk)

1. `Modul_U1` montajını paftaya getir: patlatılmış izometrik görünüş. Görünüş özelliklerinde **Show in exploded state** işaretle.
2. **Annotation > Tables > Bill of Materials**. Type: **Top-level only** ya da **Parts only**.
3. BOM sütunlarına `Description`, `Profil_Kodu`, `Malzeme`, `Agirlik` özelliklerini ekle. Bu bilgiler 1-4. günlerde parçalara yazdığın özelliklerden gelir.
4. **Auto Balloon** ile balonları yerleştir, düzenle.
5. **Revision Table** ekle ve ilk revizyonu (A) gir.

## 6. Dışa aktarma (15 dk)

1. **File > Save As > PDF**: tüm sayfalarla.
2. **File > Save As > DWG**: AutoCAD kullanan imalatçılar için. Dışa aktarma ayarlarında sürümü (ör. AutoCAD 2018) ve ölçeği 1:1 seç.
3. DWG'yi AutoCAD'de açıp ölçü ve katmanları kontrol et.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Antet kutularını model özelliklerine bağlayıp şablon olarak kaydedebiliyorum.
- [ ] Model ölçülerini Model Items ile paftaya getirebiliyorum.
- [ ] Açınım görünüşü ve büküm tablosu ekleyebiliyorum.
- [ ] Weldment kesim listesini boy ve açı sütunlarıyla çıkarabiliyorum.
- [ ] BOM'u kendi özelliklerimle özelleştirip balonlayabiliyorum.
- [ ] Paftayı PDF ve DWG olarak dışa aktarabiliyorum.

**Bonus:** Profil parçasının paftasında görünüşü design table konfigürasyonlarından birine bağla. Sonra aynı paftayı kopyalayıp her konfigürasyon için ayrı sayfa yap. Ya da BOM'da **Display configurations of the same part as separate items** ayarını dene.
