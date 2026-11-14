## Hedef

Gün sonunda cephede kendi DWG kesitinden gelen dikme profili, malzemeli spandrel paneller, bir kapı ve Rhino'dan gelen eğrisel bir yüzey üzerinde panelleme olacak. Bunların hepsinden otomatik metraj tablosu da çıkacak. Süre yaklaşık 5 saat.

Başlamadan önce:

- `Gun1_Cephe.rvt` dosyasını aç, `Gun2_Cephe.rvt` olarak kaydet.
- Elinde basit bir dikme kesiti DWG'si olsun. Sadece dış kontur yeterli, tek parça ve kapalı olması önemli.
- Rhino'da eğrisel bir cephe yüzeyi hazırla, örneğin 12 m geniş, 8 m yüksek, planda hafif kavisli tek bir surface. Birimler mm olsun.

## 1. DWG kesitten dikme profili (1,5 saat)

Revit'te dikme kesiti bir **Profile ailesi** olarak tanımlanır, sonra dikme tipine atanır. Bu, gerçek alüminyum kesitini modele taşımanın en sade yolu.

**Profil ailesini oluştur**

1. **File > New > Family**, şablon olarak `Metric Profile-Mullion.rft` seç.
2. Ortadaki iki referans düzlemin kesişimi dikmenin merkezi olacak. Curtain wall'ın çizgisi bu noktadan geçer.
3. **Insert > Import CAD** ile DWG'yi içeri al. Birim mm, konum Origin to Origin.
4. İçe aktarılan çizgiler profil olarak kullanılamaz. **Create > Line > Pick Lines** ile dış konturu tek tek seçip kendi çizgilerini oluştur.
5. Kontur kapalı olmalı, üst üste ya da açık uç kalmamalı. Sonra içe aktarılan DWG'yi sil.
6. `Dikme_Profil_01.rfa` olarak kaydet, **Load into Project**.

@fig:profil_aile

**Dikme tipine ata**

1. Project Browser'da **Curtain Wall Mullions > Rectangular Mullion** altında `Dikme_60x180` tipini Duplicate et, adı `Dikme_Gercek_01`.
2. Type parametrelerinde **Profile** = Dikme_Profil_01.
3. Curtain wall tipinde (`CW_1500`) Interior dikme tipini `Dikme_Gercek_01` yap.
4. Kesit görünüşünde Detail Level = Fine ile kontrol et.

Tuzak: Profil ters ya da yana kaymış gelirse profil ailesine dön, konturu merkez noktasına göre taşı ya da 180° döndür, tekrar yükle (Overwrite). Dış yüzün hangi tarafta olduğunu bir kez öğrenince sonraki profillerde sorun çıkmaz.

Aynı işlemi kayıt kesiti için de yap: `Kayit_Gercek_01`.

## 2. Malzemeler, spandrel ve kapı (1 saat)

**Malzemeler**

1. **Manage > Materials** aç. Bir cam malzemesini Duplicate et: `Cam_Lamine_Gunes_Kontrol`. Bir de `Al_Eloksal_Gri` ve `Spandrel_Cam_Koyu` oluştur.
2. Her birine Graphics sekmesinde renk ver, Appearance sekmesinde şeffaflığı ayarla.
3. **Identity** sekmesindeki Description ve Mark alanlarına kısa kod yaz (ör. G01, AL01). Metraj tablosunda bunları kullanacağız.

**Malzemeyi ata**

1. Dikme tiplerinde (`Dikme_Gercek_01`, `Kayit_Gercek_01`) **Material** = Al_Eloksal_Gri.
2. **Curtain Panels > System Panel > Glazed** tipini Duplicate et: `Panel_Cam_G01`, malzeme Cam_Lamine_Gunes_Kontrol, kalınlık 30 mm.
3. Aynı şekilde **Solid** tipinden `Panel_Spandrel_S01` yap, malzeme Spandrel_Cam_Koyu.
4. `CW_1500` tipinde Curtain Panel = Panel_Cam_G01. Birinci gün elle değiştirdiğin spandrel panellerini Panel_Spandrel_S01 yap.

**Curtain wall kapısı**

1. **Insert > Load Family**, Revit kütüphanesinde **Doors** klasöründen `Door-Curtain-Wall-Single-Glass.rfa` yükle.
2. Zemin kattaki bir paneli Tab ile seç, Unpin et, Type Selector'dan kapıyı seç.
3. Kapı panelin boyutunu alır. Kapı genişliğini değiştirmek için kapıyı değil, o paneli sınırlayan grid çizgisini taşı. Revit'te curtain wall içinde her şey gridden yönetilir.

## 3. Rhino yüzeyinden curtain system (1,5 saat)

Düz olmayan bir cephede curtain wall yerine **Curtain System by Face** kullanılır. Rhino yüzeyi önce kitle (mass) olarak alınır, sonra yüzüne panelleme giydirilir.

**Kitleyi oluştur**

1. Rhino'da yüzeyi dışa aktar. Revit sürümün `.3dm` içe aktarmayı destekliyorsa onu kullan, desteklemiyorsa SAT olarak kaydet.
2. Revit'te **Massing & Site > In-Place Mass**, adı `Kitle_Cephe_Egri`.
3. Kitle düzenleme modundayken **Insert > Import CAD** ile dosyayı al. Birim mm, Origin to Origin.
4. **Finish Mass**. Kitle görünmüyorsa Massing & Site'taki **Show Mass** düğmesini aç.

**Curtain system'i giydir**

1. **Architecture > Curtain System**, **Select Multiple** kapalıyken kitlenin yüzüne tıkla, **Create System**.
2. Edit Type > Duplicate: `CS_1500`.
    - Grid 1: Fixed Distance, 1500
    - Grid 2: Fixed Distance, 4000
    - Dikme ve kayıt tipleri: Dikme_Gercek_01 ve Kayit_Gercek_01
    - Curtain Panel: Panel_Cam_G01
3. Grid yönü yanlış geldiyse Grid 1/2 için **Angle** ve **Justification** ayarlarıyla düzelt.
4. 3D'de panellerin yüzeye nasıl oturduğuna ve kavis boyunca dikmelerin nasıl birleştiğine bak.

@fig:curtain_system

Sınırı bil: Bu yöntem basit yüzeyler için iyi. Rhino yüzeyi değişince yeniden içe aktarman gerekir, panel bölümlemesi de sadece düzenli grid olur. Gerçek parametrik panellemeyi GH'de yapıp Revit'e Rhino.Inside ile aktaracağız (5. gün). Bugünkü alıştırma, Revit'in kendi yeteneğinin sınırını görmen için.

## 4. Metraj tabloları (45 dk)

Revit'te metraj modelden canlı okunur: model değişince tablo da değişir. Bugün iki tablo yapacaksın: cam sipariş listesi ve profil listesi.

**Cam/panel listesi**

1. **View > Schedules > Schedule/Quantities**, kategori **Curtain Panels**, adı `Panel Listesi`.
2. Alanlar: Type, Width, Height, Area, Count.
3. **Sorting/Grouping**: önce Type, sonra Width, sonra Height. **Itemize every instance** kutusunu kaldır. Aynı ölçüdeki paneller tek satırda adetle toplanır.
4. **Formatting** sekmesinde Area için **Calculate totals** aç.
5. Tabloda bir satıra tıkla, ribbon'daki **Highlight in Model** ile o panellerin modelde nerede olduğunu gör.

**Profil listesi**

1. Yeni schedule, kategori **Curtain Wall Mullions**, adı `Profil Listesi`.
2. Alanlar: Type, Length, Count. Type ve Length'e göre grupla, Itemize every instance kapalı.
3. Length için de Calculate totals aç. Dikme ve kayıt için toplam metreyi ayrı ayrı gör.

**Canlılık testi ve Excel**

1. `CW_1500` tipinde dikey grid aralığını 1500'den 1350'ye al. İki tablonun da anında değiştiğini gör, sonra geri al.
2. **File > Export > Reports > Schedule** ile tabloyu `.txt` olarak dışa aktar, Excel'de aç. Kendi metraj ya da sipariş karşılaştırma dosyalarına bu şekilde veri akıtabilirsin.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne, yani Family Editor'e hazırsın.

- [ ] DWG kesitten kapalı bir profil ailesi yapıp dikme tipine atayabiliyorum.
- [ ] Profil ters gelince nereden düzelteceğimi biliyorum.
- [ ] Malzeme oluşturup panel ve dikme tiplerine atayabiliyorum.
- [ ] Bir paneli kapıya çevirip kapı genişliğini grid ile ayarlayabiliyorum.
- [ ] Rhino yüzeyini kitle olarak alıp üzerine curtain system giydirebiliyorum.
- [ ] Panel ve profil metraj tablolarını gruplu ve toplamlı çıkarabiliyorum.
- [ ] Tabloyu Excel'e aktarabiliyorum.

**Bonus:** Panel Listesi'ne **Fields > Add Parameter** ile bir `Cam_Kodu` proje parametresi ekle, kategori Curtain Panels. Birkaç panele farklı kod yaz ve tabloyu bu koda göre grupla. 5. günde bu parametreyi Grasshopper'dan otomatik dolduracağız.
