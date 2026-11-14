## Hedef

Son gün, ilk altı günde öğrendiklerini parametrik bir modül modelinde birleştiriyoruz. Gün sonunda tek bir iskelet parçadan yönetilen, genişliği ve yüksekliği değişince profilleri, camı ve paneli birlikte güncellenen bir modül montajın olacak. Ayrıca modeli diğer programlara (Rhino, Revit, imalat) doğru formatlarda aktaracak ve dosyaları teslim paketine dönüştüreceksin. Süre yaklaşık 5 saat.

## 1. İskelet (skeleton) yaklaşımı (2 saat)

Büyük montajlarda parçaları birbirine mate'lemek yerine hepsini ortak bir **iskelet parçaya** bağlamak daha sağlamdır. İskelet, sadece sketch ve düzlemlerden oluşan, geometrisiz bir parçadır. Grasshopper'daki ana parametre setinin SolidWorks'teki karşılığıdır.

**İskelet parçası**

1. Yeni parça: `Iskelet_U1.SLDPRT`. Global değişkenler: `"Modul_G"` = 1500, `"Modul_Y"` = 3500, `"Profil_G"` = 60.
2. Front Plane'de bir dikdörtgen sketch: modülün dış sınırı, ölçüleri değişkenlere bağlı, sol alt köşe originde. Adı `Modul_Sinir`.
3. Profil eksenleri için ikinci bir sketch: dış sınırdan `"Profil_G"/2` içeride ikinci bir dikdörtgen. Adı `Profil_Eksen`.
4. Gerekirse cam düzlemi için bir **Reference Plane**: Front Plane'den belirli mesafe önde.

**İskelete bağlı montaj**

1. Yeni montaj: `Modul_U1_Param.SLDASM`. İlk bileşen olarak iskeleti **origine** yerleştir (fixed).
2. Montaj içinde yeni parça oluştur: **Insert > Component > New Part**. Bir düzlem seç; SolidWorks parçayı montaj içinde düzenleme moduna alır.
3. Sketch'i iskeletin `Profil_Eksen` çizgilerine **Convert Entities** ile bağla. Bu bir **dış referans** (in-context) oluşturur: parça artık iskeletin ölçülerini izler.
4. Dikme ve kayıtları bu yolla iskeletin çizgilerine bağla. Gönyeli köşeler için 4. günün weldment yöntemini kullanabilirsin: iskelet çizgilerine Structural Member giydir.
5. Cam ve kaset paneli de aynı şekilde iskeletin iç sınırına bağla.

**Test**

İskeleti aç, `"Modul_G"` = 1200 ve `"Modul_Y"` = 3000 yap, kaydet. Montaja dön, **Ctrl+Q**. Profiller, cam ve panel yeni ölçüye uymalı.

@fig:iskelet

**Dış referansları kontrol altında tut**

- Bir parça yalnızca iskelete referans versin, diğer parçalara değil. Parçadan parçaya referans zinciri kurulursa model kırılgan olur.
- Parçaya sağ tıkla, **List External References**: her referansın kaynağının iskelet olduğunu kontrol et.
- Tasarım bitince referansları **Lock** ile dondurabilirsin. Kilitli parça, iskelet değişse de güncellenmez.

## 2. Veri değişimi (1,5 saat)

Her program kendi dilini konuşur. Doğru formatı seçmek, karşı tarafın modeli kullanılabilir almasını sağlar.

| Kime | Format | Not |
| --- | --- | --- |
| Rhino, başka bir 3D program | STEP (AP214 ya da AP242) | Katı gövde olarak gider; en güvenli genel format |
| SolidWorks ya da Parasolid tabanlı programlar | Parasolid (.x_t) | Geometri kaybı en az |
| Revit, BIM koordinasyonu | IFC (IFC 2x3 ya da IFC4) | **File > Save As**, IFC seç; özellikler IFC'ye taşınır |
| İmalat (CNC, lazer) | DXF (açınım) | 3. günde olduğu gibi Flat-Pattern'den |
| Görselleştirme, web | STL ya da glTF | Mesh, ölçü bilgisi yok |

1. Montajı STEP olarak kaydet. **Options** düğmesinden STEP sürümünü (AP214 ya da AP242) seç; montaj tek bir gövdeye değil, parça parça gitmeli.
2. STEP'i Rhino'da aç ve kontrol et: birim mm mi, parçalar ayrı ayrı mı geliyor, katı mı yüzey mi?
3. Montajı IFC olarak kaydet. Bir IFC görüntüleyicide (ör. BIMcollab ZOOM) açıp parçaların ve özelliklerin geldiğini kontrol et.
4. Ters yönde Rhino'dan gelen bir modeli STEP olarak al. **Import Diagnostics** ile hatalı yüzeyleri onar.

**Toplu DXF ve PDF**

Lisansında **SOLIDWORKS Task Scheduler** varsa (Windows başlat menüsünde SOLIDWORKS Tools altında) bir klasördeki tüm paftaları tek seferde PDF ya da DWG'ye çevirebilirsin. Yoksa bu iş için VBA makrosu yazılabilir.

## 3. Dosya düzeni ve teslim (1 saat)

**Adlandırma kuralı**

Proje boyunca aynı kuralı kullan, ör. `PRJ-CPH-Tip-Kod-Rev` (`P24-CPH-PR-AL01-A.SLDPRT`). SolidWorks dosya adına göre çalıştığı için aynı adda iki farklı dosya en sık karşılaşılan karışıklığın sebebidir.

**Pack and Go**

1. Montaj açıkken **File > Pack and Go**.
2. Montajın kullandığı tüm parçalar, pafta ve tablolar listelenir. **Include drawings** işaretli.
3. Hedef olarak tek bir klasör ya da **Save to Zip file** seç. Gerekirse önek/sonek ekleyerek tüm dosyaları yeni adla kopyala.
4. Çıkan zip'i başka bir klasöre açıp montajı oradan aç. Eksik dosya uyarısı gelmemeli.

**Teslim kontrolü**

Teslimden önce şunları kontrol et:

- Tüm parçalarda Description, Malzeme ve Ağırlık özellikleri dolu.
- Ağaçta kırmızı (hatalı) ya da sarı (uyarılı) feature yok.
- Montajda tanımsız (-) parça yok; ya da varsa bilinçli.
- Interference Detection temiz ya da kalan çakışmalar açıklanmış.
- Paftalar güncel: modelde son değişiklikten sonra kaydedilmiş.
- PDF, DWG, DXF ve STEP/IFC çıktıları ayrı klasörlerde, aynı adlandırma kuralıyla.

## Gün sonu kontrolü (15 dk)

- [ ] İskelet parça kurup diğer parçaları ona bağlayabiliyorum.
- [ ] İskelet ölçüsünü değiştirince montajın güncellendiğini gördüm.
- [ ] Dış referansları listeleyip kilitleyebiliyorum.
- [ ] Alıcıya göre doğru dışa aktarma formatını seçebiliyorum.
- [ ] STEP ve IFC çıktısını başka bir programda açıp kontrol ettim.
- [ ] Pack and Go ile eksiksiz bir teslim paketi hazırlayabiliyorum.

**Haftadan sonra**

- **Kendi kütüphanen:** Profiller, konsollar, ankraj plakaları ve bağlantı elemanlarını konfigürasyonlu parçalar olarak tek bir klasörde topla.
- **Şablonlar:** Parça, montaj ve pafta şablonlarına özellik alanlarını önceden ekle. Her yeni dosya aynı bilgilerle başlasın.
- **Otomasyon:** Tekrar eden işler (toplu DXF, özellik doldurma, dosya adlandırma) için SolidWorks API ile VBA ya da C# makroları yazılabilir.
- **Simülasyon:** Lisansında **SOLIDWORKS Simulation** varsa konsol ve ankraj plakası için basit statik analizle gerilme ve sehim kontrolü yapabilirsin.
