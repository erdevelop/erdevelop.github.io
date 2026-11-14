## Hedef

Gün sonunda çelik kutu profillerden oluşan, kaynaklı bir cephe alt konstrüksiyon konsolu (braket çerçevesi) parçan olacak. Kesim listesinde her elemanın boyu ve kesim açısı otomatik çıkacak. 2. günün alüminyum profilini de weldment profili olarak kullanmayı öğreneceksin. Süre yaklaşık 5 saat.

Weldments, tek bir parça dosyası içinde çok gövdeli (multibody) bir konstrüksiyon kurar. İskeleti çizgilerle çizer, profilleri bu çizgilere giydirirsin. Grasshopper'da çizgiye kesit süpürmeye benzer.

## 1. İskelet sketch (1 saat)

Hedef: 600 mm yüksek, 400 mm derin bir L konsol: dikey dikme, yatay kol ve 45° bir çapraz.

1. Yeni parça, MMGS. **Right Plane**'de sketch aç.
2. **Line** ile çiz: origin'den yukarı 600 mm dikey çizgi, üst uçtan öne 400 mm yatay çizgi, dikey çizginin ortasından yatay kolun ucuna bir çapraz.
3. Tüm ölçü ve ilişkileri ver, sketch siyah olsun. Çaprazın alt ucunu dikey çizginin orta noktasına **Midpoint** ile bağla.
4. Sketch'i `Iskelet` olarak adlandır.
5. Üç boyutlu konstrüksiyonlarda bu iskelet **3D Sketch** ile ya da birkaç düzlemdeki sketch'lerle kurulur. Bugün tek düzlemde başlıyoruz.

## 2. Structural Member (1,5 saat)

1. **Insert > Weldments > Weldment** (ya da Weldments sekmesinden ilk komut). Ağaca Weldment feature'ı ve **Cut list** klasörü eklenir.
2. **Structural Member**: Standard **iso**, Type **square tube**, Size **40 x 40 x 4**.
3. **Group 1**: dikey çizgi. **New Group**, **Group 2**: yatay kol. **Group 3**: çapraz. Her grubu ayrı tutmak birleşim köşelerini ayrı ayrı ayarlamanı sağlar.
4. Profil yönü yanlışsa **Rotation angle** ya da **Locate profile** ile profili çizgiye göre döndür ve kaydır.
5. Köşe birleşimi: dikey ve yatay arasında **Corner treatment > End Miter** (45° gönye) seç.

**Trim/Extend**

1. Çapraz, dikme ve kol içine girer. **Weldments > Trim/Extend**.
2. Kesilecek gövde: çapraz. Sınır: dikme ve kol gövdeleri. Trim boundary olarak **Bodies** seç; çapraz profillerin yüzüne tam oturacak şekilde kesilir.

**Kapak, takviye ve kaynak**

1. **End Cap**: açık kalan profil uçlarına 4 mm kapak.
2. **Gusset**: dikme ile kol köşesine üçgen takviye levhası, 100 x 100 mm, 6 mm.
3. **Fillet Bead**: köşe birleşimine 4 mm köşe kaynağı (görsel ve kaynak boyu hesabı için).
4. Bir önceki günün ankraj plakasını dikmenin altına taban levhası olarak ekleyebilirsin: **Insert > Part** ile parçayı gövde olarak al.

@fig:weldment

## 3. Kesim listesi (1 saat)

1. FeatureManager'da **Cut list**'e sağ tıkla, **Update**. Aynı boy ve kesime sahip gövdeler tek satırda toplanır.
2. Bir cut list öğesine sağ tıkla, **Properties**. Otomatik gelen alanlar: **LENGTH**, **ANGLE1**, **ANGLE2**, **MATERIAL**, **Description**, kütle.
3. Gönye açılarının (ANGLE1/2) doğru geldiğini kontrol et. Çaprazın açısı 45° civarında olmalı.
4. Cut list klasöründeki öğeleri anlamlı adlandır: `Dikme`, `Kol`, `Capraz`, `Kapak`, `Takviye`.
5. Malzeme: weldment gövdelerine malzemeyi parçanın tamamına ya da gövde bazında verebilirsin. **S235JR** ya da kütüphanede yoksa **Plain Carbon Steel**.

## 4. Kendi profilini weldment kütüphanesine ekle (1 saat)

2. günün alüminyum profilini Structural Member listesinde seçilebilir hale getireceğiz.

1. **Tools > Options > System Options > File Locations > Weldment Profiles** yolunu öğren.
2. Bu klasörün altında `Cephe\Aluminyum` gibi bir klasör yapısı oluştur. SolidWorks bunu Standard ve Type olarak okur.
3. Yeni parça aç, Front Plane'de 2. günün DWG kesitini sketch olarak al. Sketch'te profilin yerleşim noktasını origine bağla.
4. Sketch'i ağaçta seç ve **File > Save As**, dosya türü **Lib Feat Part (*.sldlfp)**. Adı boyut olarak görünür, ör. `AL-01.sldlfp`. Kaydı az önceki klasöre yap.
5. Konsol parçasına dön, yeni bir Structural Member ekle: Standard **Cephe**, Type **Aluminyum**, Size **AL-01**.

@fig:profil_kutuphane

Bu yöntemle firmanın tüm profil serisini bir kez kütüphaneye koyarsın; herkes aynı kesitle çalışır.

Kaydet: `Konsol_K1.SLDPRT`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne, yani montaja geçebilirsin.

- [ ] Weldment iskeletini tam tanımlı sketch olarak kurabiliyorum.
- [ ] Structural Member'da grupları ve köşe birleşimini ayarlayabiliyorum.
- [ ] Trim/Extend ile profilleri birbirine oturtabiliyorum.
- [ ] End Cap, Gusset ve Fillet Bead ekleyebiliyorum.
- [ ] Cut list'i güncelleyip boy ve açıları okuyabiliyorum.
- [ ] Kendi profilimi .sldlfp olarak weldment kütüphanesine ekleyebiliyorum.

**Bonus:** Konsolun yüksekliğini ve kol boyunu global değişkene bağla. Değerleri değiştirip cut list'teki LENGTH değerlerinin güncellendiğini kontrol et. Kesim listesi artık parametrik.
