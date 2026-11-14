## Hedef ve panel ailesi seçimi

Gün sonunda iki panel ailen olacak. Birincisi, curtain wall gridinin boyutunu otomatik alan, çerçeveli, cam ya da spandrel olabilen bir unitize panel. İkincisi, 4 köşe noktasıyla her yere yerleşen bir adaptive panel. Süre yaklaşık 5 saat. Başlangıç dosyası: `Gun2_Cephe.rvt`.

| Aile türü | Şablon | Boyutu kim belirler | Ne zaman |
| --- | --- | --- | --- |
| Curtain Wall Panel | Metric Curtain Wall Panel.rft | Curtain wall gridi | Düz, düzenli cepheler (işlerin çoğu) |
| Curtain Panel Pattern Based | Metric Curtain Panel Pattern Based.rft | Kitle yüzeyindeki Divide Surface | Revit içinde bölünen eğrisel yüzeyler |
| Adaptive Component | Metric Generic Model Adaptive.rft | Yerleştirirken tıklanan noktalar | Serbest geometri, Grasshopper'dan gelen paneller |

Pattern Based ailesi aslında adaptive mantığıyla çalışır. Bu yüzden bugün sadece adaptive'i öğreniyoruz. Panellemeyi Grasshopper'da yapan biri için adaptive daha önemli.

## 1. Unitize panel ailesi (2,5 saat)

**Şablonu tanı**

1. **File > New > Family**, `Metric Curtain Wall Panel.rft`. `Panel_Unitize.rfa` olarak kaydet.
2. **Elevations > Exterior** aç. Left, Right, Top ve Bottom düzlemleri panelin kenarlarıdır. Bunların arasındaki Width ve Height değerlerini curtain wall gridi belirler. Bu ölçülere kendi parametreni bağlama.

**Çerçeve iç kenarı**

1. Exterior görünüşünde 4 kenarın her birinin içine birer düzlem çiz: `Ic_Sol`, `Ic_Sag`, `Ic_Ust`, `Ic_Alt`.
2. Her birini kendi kenarına ölçüyle bağla ve dördünü de aynı Type parametresine etiketle: `Cerceve_Genislik` = 50.
3. Flex testi: Family Types'ta Width ve Height gri görünür ama deneme için değiştirilebilir. 1500 x 4000 ve 900 x 2500 dene; iç düzlemler kenarlarla birlikte gelmeli.

**Çerçeve geometrisi**

1. **Create > Extrusion**, Set Work Plane: Center (Front/Back).
2. İki dikdörtgen çiz: dıştaki 4 kenar düzlemine, içteki 4 iç düzleme. 8 kilidin hepsini kapat. İç içe iki kapalı halka çerçeve kesiti verir.
3. Extrusion Start = 0, End: `Cerceve_Derinlik` (yeni Type parametresi, 120).
4. Material: yeni Type parametresi `Cerceve_Malzeme`.

**Cam ve spandrel**

1. Yeni Extrusion: sadece iç dikdörtgen, 4 iç düzleme kilitli. Start = 0, End: `Cam_Kalinlik` (Type, 30). Material: `Cam_Malzeme`.
2. Aynı sketch ile ikinci bir extrusion daha yap. End yine `Cam_Kalinlik`, Material: `Spandrel_Malzeme`.
3. Yeni **Instance** Yes/No parametresi: `Spandrel`. Instance olması önemli; her panel yeni tip açmadan tek tek değiştirilebilsin.
4. Yeni Yes/No parametresi `Cam_Gorunur`, formül: `not(Spandrel)`.
5. Cam extrusion'ının Visible'ını `Cam_Gorunur`'e, spandrel extrusion'ının Visible'ını `Spandrel`'e bağla.
6. Flex testi: Spandrel kutusunu açıp kapatınca iki parçanın yer değiştirdiğini gör.

@fig:panel_aile

**Tip ve kayıt**

Family Types'ta tip adını `PU_50x120` yap. Description = `Unitize cephe paneli`. Kaydet.

## 2. 4 noktalı adaptive panel (1,5 saat)

Adaptive ailede referans düzlemi yoktur. Geometri, projede yerleştirirken tıklanan noktalara bağlıdır. GH'deki 4 köşe noktasından panel üretme mantığının Revit'teki karşılığı budur.

**Noktalar**

1. **File > New > Family**, `Metric Generic Model Adaptive.rft`. `Panel_Adaptive_4N.rfa` olarak kaydet.
2. Ref. Level planında **Create > Point** (Reference Point) ile yaklaşık 1500 x 2000 mm bir dikdörtgenin 4 köşesine nokta koy. Sıra önemli: tek yönde, örneğin sol alt, sağ alt, sağ üst, sol üst.
3. Dördünü seç, **Make Adaptive**. Noktaların yanında 1-4 numaraları çıkar. Projede yerleştirirken de bu sırayla tıklayacaksın.

@fig:adaptive

**Kenarlar ve yüzey**

1. **Create > Reference Line**, ribbon'da **3D Snapping** açık. 1-2, 2-3, 3-4, 4-1 noktalarını bağla.
2. Dört referans çizgisini seç, **Create Form > Solid Form**. Revit kalınlıklı kutu ya da düz yüzey seçeneği sunarsa **yüzeyi** seç.
3. Yüzeyi seç, Material yanındaki düğmeyle `Cam_Malzeme` Type parametresine bağla.

**Flex testi**

3D görünüşte 3 numaralı noktayı seç, ok tutamaçlarından dikey olanı yukarı çek. Yüzey bu noktaya göre eğrilir (warped panel). Kenarlar noktalardan kopuyorsa referans çizgileri 3D Snapping kapalıyken çizilmiştir; sil ve yeniden çiz. Testten sonra Undo yap.

**Kalınlık hakkında**

Bu panel kalınlıksız bir yüzeydir. Koordinasyonda cam için çoğu zaman yeterlidir. Kalınlık ve çerçeve gerekiyorsa iki yol var:

- Düz paneller için 1. bölümdeki unitize panel ailesini kullan.
- Serbest ve kalınlıklı paneller için geometriyi GH'de üretip Rhino.Inside ile DirectShape olarak gönder (5. gün).

**Bonus: Çerçeve sweep'i**

Önce 1 numaralı noktayı seç ve onun 1-2 kenarına dik düzlemini work plane yap. Bu düzlemde 50 x 120 mm bir dikdörtgen profil çiz. Profili ve 4 referans çizgisini birlikte seç, **Create Form > Solid Form**. Profil köşelerde doğru dönmezse bu adımı atla; amaç sadece sweep mantığını görmek.

## 3. Projede deneme ve 5. güne hazırlık (1 saat)

**Unitize paneli cepheye ver**

1. `Panel_Unitize.rfa`'yı `Gun2_Cephe.rvt`'ye yükle.
2. `CW_1500` tipini Duplicate et: `CW_Unitize`. Unitize sistemde çerçeve panelin içinde olduğu için tüm dikme ve kayıt tiplerini **None** yap. Curtain Panel = Panel_Unitize : PU_50x120.
3. Birinci günün düz cephesini `CW_Unitize` tipine çevir. Planda panelin duvar çizgisine göre hangi tarafta durduğunu kontrol et.
4. Bir paneli Tab ile seç, Properties'te **Spandrel** kutusunu işaretle. Pinli olduğu için işaretlenmiyorsa önce Unpin et.

**Adaptive paneli yerleştir**

1. `Panel_Adaptive_4N.rfa`'yı yükle, 3D görünüşe geç.
2. **Component** komutuyla 2. günün eğrisel kitlesinin yüzünde 4 nokta tıkla. Sıra: aile içindeki 1-2-3-4.
3. Yerleşen paneli seç, bir köşe noktasını sürükle. Panelin noktayı takip ettiğini gör.

**Shared parameter (5. gün için şart)**

Aile parametreleri metraj tablosunda görünmez, Grasshopper'dan da güvenilir şekilde yazılamaz. Bu yüzden ortak parametre dosyası kuruyoruz. Oluşturulacak parametreler:

| Parametre | Tip | Kullanımı |
| --- | --- | --- |
| Panel_ID | Text | GH'den gelen benzersiz panel numarası |
| Cam_Kodu | Text | Cam sipariş kodu (G01, G02...) |
| Spandrel_SP | Yes/No | Panelin spandrel olup olmadığı |

1. **Manage > Shared Parameters > Create**: `Cephe_Parametreleri.txt`. Grup `Panel`, içinde yukarıdaki üç parametre.
2. **Manage > Project Parameters > Add**, Shared parameter seç, `Panel_ID` ve `Cam_Kodu`'yu **Instance** olarak Curtain Panels ve Generic Models kategorilerine ekle.
3. İkinci günde Cam_Kodu'yu proje parametresi olarak açtıysan onu sil, shared olanı kullan.
4. Panel Listesi tablosuna Panel_ID ve Cam_Kodu alanlarını ekle.

Spandrel_SP için: `Panel_Unitize.rfa`'yı aç, Family Types'ta `Spandrel` parametresini seç, **Edit Parameter** ile **Shared parameter** seçeneğine geç ve dosyadan `Spandrel_SP`'yi seç. Aileyi projeye yeniden yükle. Spandrel bilgisi artık Panel Listesi'ne alan olarak eklenebilir.

**Rhino.Inside.Revit kurulumu**

1. Rhino.Inside.Revit'in Revit sürümünle uyumlu kurulumunu resmi siteden indir ([rhino3d.com/inside/revit](https://www.rhino3d.com/inside/revit/)). Rhino 8 kurulu olmalı.
2. Revit'i aç ve **Rhinoceros** sekmesinin geldiğini gör. Oradan Rhino'yu ve Grasshopper'ı bir kez başlat.
3. Grasshopper'da Revit bileşen sekmelerinin geldiğini kontrol et. Gelmediyse Rhino.Inside.Revit sürümünün Revit sürümünle uyumlu olduğunu kontrol et.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne, yani Rhino.Inside.Revit'e hazırsın.

- [ ] Curtain Wall Panel ailesinde boyutun neden gridden geldiğini ve kenar ölçülerine neden parametre bağlamadığımı biliyorum.
- [ ] İki halkalı sketch ile çerçeve extrusion'ı yapabiliyorum.
- [ ] Instance Yes/No ve not() formülüyle cam/spandrel geçişi kurabiliyorum.
- [ ] Unitize sistem için dikmesiz bir curtain wall tipi kurabiliyorum.
- [ ] 4 noktalı adaptive panel yapıp projede yerleştirebiliyorum.
- [ ] Shared parameter dosyası kurup proje parametresi olarak ekleyebiliyorum.
- [ ] Rhino.Inside.Revit kurulu ve Grasshopper Revit içinden açılıyor.

**Bonus:** Unitize panele `Cam_Ofset` adlı bir Type parametresi ekle ve camla çerçevenin ön yüzleri arasındaki mesafeyi buna bağla. Camı çerçeve derinliğinin ortasına almak için Center (Front/Back)'e paralel yeni bir düzlem açman gerekecek.
