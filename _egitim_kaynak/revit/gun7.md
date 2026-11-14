## Hedef ve teslim paketi

Gün sonunda 6. günün köşe modeli müşteriye gönderilebilir durumda olacak: temiz bir RVT, doğru koordinatlı bir IFC, metraj tabloları ve kısa bir teslim notu. Süre yaklaşık 5 saat. Bu akışı bir kez köşe üzerinde oturtunca cephenin tamamı için aynısını tekrarlarsın.

Teslim paketi:

| Dosya | İçerik | Kim kullanır |
| --- | --- | --- |
| `..._Cephe.rvt` | Senin cephe modelin, müşteri linkleri olmadan | Müşterinin BIM ekibi, kendi modeline link eder |
| `..._Cephe.ifc` | Aynı model, IFC olarak | Navisworks, Solibri ya da Revit dışı yazılımlar |
| `..._Panel_Listesi.xlsx` / `..._Ankraj_Listesi.xlsx` | Metraj tabloları | Proje yönetimi, satınalma |
| `..._Teslim_Notu.pdf` | Sürüm, koordinat, kapsam, varsayımlar, açık konular | Herkes |

@fig:teslim

Rhino'dan doğrudan IFC alan bir yöntemin varsa, bugün çıkan IFC'yi onunla karşılaştırmak hangisiyle devam edeceğine karar vermek için iyi bir fırsat.

## 1. Model kontrolü (1,5 saat)

Önce çalışma dosyasını kaydet ve teslim için kopyasını al. Temizlik adımlarını kopyada yap; çalışma dosyan Grasshopper bağlantısıyla birlikte bozulmadan kalsın.

**Uyarılar**

1. **Manage > Warnings** aç. Her uyarı türüne bak, **Show** ile elemanı modelde bul.
2. Çakışan ya da üst üste binen elemanları ve tekrarlanan Mark değerlerini mutlaka çöz. Bunlar müşterinin modelinde de uyarı üretir.
3. Çözemediğin ve zararsız olduğuna emin olduğun uyarıları teslim notuna yaz.

**Boş ve tekrarlanan parametreler**

1. Panel ve Ankraj listelerini kopyala, kopyalarda **Filter** sekmesinde Panel_ID (ya da Mark) için **has no value** koşulu ver. Tablo boş gelmeli.
2. Asıl tablolarda **Itemize every instance** açık, Panel_ID'ye göre sırala. Aynı numaranın iki kez geçip geçmediğine bak.
3. Görsel kontrol: 3D görünüşte **View Filter** oluştur. Panel_ID değeri olmayan elemanları kırmızıya boya. Boşta kalan bir parça hemen göze çarpar.

**Son koordinasyon**

1. Linkleri güncelle (**Manage Links > Reload**) ve Copy/Monitor uyarısı var mı diye **Coordination Review**'a bak.
2. Interference Check'i tekrar çalıştır. 6. günden kalan açık çakışmaları teslim notuna yaz.

**Temizlik**

1. Çalışma için açtığın geçici görünüşleri, test kesitlerini ve kullanılmayan tabloları sil.
2. **Manage > Purge Unused** çalıştır. Bir temizlik diğerini serbest bıraktığı için 2-3 kez tekrarla.
3. Kullanılmayan ama müşterinin ihtiyaç duyabileceği tipler varsa (ör. B200 braket) Purge listesinden onların işaretini kaldır.

## 2. RVT teslimi (1 saat)

**Açılış görünüşü**

1. Bir drafting view aç: `00_Bilgi`. İçine proje adını, revizyon numarasını, tarihi, koordinat sistemini ve kapsamı (ör. Köşe A, aks 1-3, zemin-çatı) metin olarak yaz.
2. **Manage > Starting View** ile bu görünüşü seç. Dosya hangi bilgisayarda açılırsa açılsın önce bu ekran gelir. Hafif olduğu için dosya da hızlı açılır.
3. Bir de teslim 3D görünüşü hazırla: `3D_Teslim`. Tüm cephe görünsün, Section Box kapalı olsun.

**Linkler**

1. **Manage > Manage Links** aç. Müşterinin mimari ve statik linklerini **Remove** ile kaldır. Bu modeller zaten onlarda var; senin dosyandaki yollar onlarda çalışmaz.
2. Koordinatlar dosyaya işlenmiş olduğu için link kaldırılsa da modelin konumu bozulmaz. Müşteri senin dosyanı **By Shared Coordinates** ile link ettiğinde doğru yerde oturur.

**Kaydet ve doğrula**

1. **File > Save As > Options**: **Compact File** işaretli. BEP'teki adla kaydet.
2. Dosyayı kapat. **File > Open** penceresinde **Audit** kutusunu işaretleyerek yeniden aç. Hata vermemeli.
3. Teslim dosyanı kontrol için müşterinin mimari modeliyle birlikte yeni boş bir projeye **By Shared Coordinates** ile link et ve müşteri modeline göre doğru yerde olduğunu bir kez daha gör.

**Tabloları Excel'e aktar**

1. Panel ve Ankraj listelerini aç, **File > Export > Reports > Schedule** ile her birini `.txt` olarak dışa aktar.
2. Excel'de aç, başlık satırını biçimlendir ve `.xlsx` olarak kaydet.
3. Excel dosyasındaki toplamları Revit tablosundaki toplamlarla karşılaştır.

## 3. IFC export (1,5 saat)

**Export görünüşü**

`IFC_Export` adlı bir 3D görünüş aç. Sadece teslim edilecek cephe elemanları görünsün. Yardımcı çizgileri, kitleleri (mass) ve test elemanlarını VV ile kapat.

**Sınıf eşleme**

IFC'de her eleman bir sınıfa girer. Varsayılan eşlemede Generic Models IfcBuildingElementProxy olur. Bu "tanımsız eleman" demektir ve koordinasyon yazılımlarında filtrelenmesi zordur. Düzeltmek için:

1. Shared parameter dosyana iki Text parametre ekle: `IfcExportAs` ve `IfcExportType`. Bu adları aynen kullan; IFC exporter bunları tanır.
2. Bunları Generic Models için instance proje parametresi yap.
3. Değerleri Grasshopper'dan ya da tabloda elle doldur:

| Eleman | IfcExportAs | IfcExportType |
| --- | --- | --- |
| Adaptive ve DirectShape paneller | IfcPlate | CURTAIN_PANEL |
| Ankraj braketleri | IfcDiscreteAccessory | BRACKET |
| Curtain wall panelleri ve dikmeler | Boş bırak; Revit zaten IfcPlate ve IfcMember olarak verir | |

**Export ayarları**

1. **File > Export > IFC**, **Modify Setup**. Varsayılan setup'ı kopyala, adı `Cephe_IFC`.
2. **IFC Version:** Müşteri ne istiyorsa o. Belirtilmemişse koordinasyon için **IFC4 Reference View**; müşterinin yazılımı eskiyse **IFC2x3 Coordination View 2.0**.
3. **Additional Content:** **Export only elements visible in view** işaretli, görünüş IFC_Export.
4. **Property Sets:** **Export Revit property sets** ve **Export IFC common property sets** işaretli. Panel_ID ve Cam_Kodu bu şekilde IFC'ye taşınır.
5. **Koordinat tabanı:** Location ya da Advanced sekmesinde (sürüme göre) **Shared Coordinates** seç.
6. Export et.

**Doğrulama**

1. IFC'yi ücretsiz bir görüntüleyicide aç (ör. BIMcollab ZOOM ya da BIMvision).
2. Kontrol et:
    - Model doğru yerde mi? Müşterinin mimari IFC'si varsa onu da aynı görüntüleyicide aç.
    - Bir panele tıkla: sınıfı IfcPlate mi, Panel_ID ve Cam_Kodu özellikler arasında görünüyor mu?
    - Panel ve ankraj adetleri Revit tablolarıyla aynı mı?
3. Rhino'dan doğrudan IFC alma yöntemin varsa aynı köşe için onunla da bir IFC çıkar. İkisini görüntüleyicide yan yana koy ve şunları karşılaştır: sınıflar, parametreler, koordinat ve dosya boyutu.

## 4. Teslim kontrol listesi ve sonrası (1 saat)

**Teslim notu** (1 sayfa, PDF)

- Proje, kapsam (hangi aks ve kotlar), revizyon ve tarih
- Revit sürümü, IFC sürümü, koordinat sistemi
- Hangi eleman nasıl modellendi (6. günün yöntem tablosu)
- Parametre listesi ve anlamları (Panel_ID, Cam_Kodu, Mark...)
- Varsayımlar ve müşteriden beklenen cevaplar
- Açık çakışmalar ve bilinen uyarılar

**Göndermeden önce son kontrol**

- [ ] RVT müşterinin sürümünde, Audit ile hatasız açılıyor.
- [ ] Açılış görünüşü bilgi sayfası.
- [ ] Müşteri linkleri kaldırıldı, model shared coordinates ile doğru yerde.
- [ ] Boş ya da tekrarlanan Panel_ID / Mark yok.
- [ ] Purge yapıldı, geçici görünüşler silindi.
- [ ] IFC görüntüleyicide doğru yerde, sınıflar ve parametreler doğru.
- [ ] Excel tabloları ile Revit toplamları aynı.
- [ ] Dosya adları BEP'e uygun, teslim notu ekli.

**Haftadan sonra**

Bu hafta Revit'in cephe işi için gereken çekirdeğini kurdun. Bundan sonrası için öneriler:

- **Köşe → tam cephe:** Aynı akışı cephenin geri kalanına uygula. GH tanımlarını cephe bloklarına göre böl.
- **Kendi aile kütüphanen:** Panel, braket ve profil ailelerini temizleyip bir klasörde topla. Her yeni projede sıfırdan başlama.
- **Kendi proje şablonun:** Shared parametreler, tablolar, görünüş filtreleri ve IFC setup'ını içeren bir `.rte` şablonu yap.
- **Otomasyon:** Python biliyorsan tekrar eden kontrolleri (boş parametre, tekrarlanan numara, IFC sınıf ataması) Rhino.Inside içinde Python bileşenleriyle otomatikleştirebilirsin.
