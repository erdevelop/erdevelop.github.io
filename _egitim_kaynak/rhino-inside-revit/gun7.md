## Hedef

Son gün haftanın parçalarını bir **cephe koordinasyon modeli** teslimine dönüştürüyorsun: Rhino'daki tasarımdan LOD 350 seviyesinde Revit modeline, oradan IFC'ye. Ekip için tek tıkla çalışan bir Grasshopper Player düğmesi de hazırlayacaksın. Süre yaklaşık 5 saat.

## 1. Teslim iş akışı (1,5 saat)

@fig:teslim

| Aşama | Araç | Sonuç |
| --- | --- | --- |
| Referans | Revit mimari model (2. gün) | Seviyeler, döşeme kenarları, akslar |
| Tasarım | Rhino + Grasshopper | Cephe yüzeyi, panelizasyon, dikme ve kayıt hatları |
| Yazma | RiR | Panel ve braket aileleri, cephe aksları, gerekirse DirectShape detaylar |
| Bilgi | Revit parametreleri | PanelNo, CamKodu, Durum, Revizyon |
| Kontrol | Revit çizelgeleri + Grasshopper | Adetler, çakışmalar, eksik parametreler |
| Teslim | IFC + RVT | Koordinasyon modeli |

**LOD 350 için cephe modelinde beklenenler** (projenin BIM uygulama planına göre değişir): panellerin gerçek ölçü ve konumu, dikme ve kayıtların gerçek kesit zarfı, ankraj ve braketlerin konumu ve yaklaşık boyutu, diğer disiplinlerle arayüzler (döşeme, kolon, yangın durdurucu bölgesi). Profil iç detayı, conta, vida LOD 400'dür ve genellikle istenmez.

## 2. Kategoriler ve IFC (1,5 saat)

@fig:ifc

Doğru kategori, modelin hem Revit'te hem IFC'de doğru anlaşılmasını sağlar.

| Eleman | Revit kategorisi | IFC sınıfı (yaygın eşleme) |
| --- | --- | --- |
| Perde duvar (bütün) | Duvarlar (perde duvar tipi) | IfcCurtainWall |
| Cam / opak panel | Perde Duvar Panelleri ya da Genel Modeller | IfcPlate |
| Dikme / kayıt | Perde Duvar Dikmeleri ya da Genel Modeller | IfcMember |
| Braket / ankraj | Genel Modeller ya da Yapısal Bağlantılar | IfcMechanicalFastener ya da IfcDiscreteAccessory |

1. Genel Modeller kategorisindeki ailelerin IFC sınıfını ailede ya da örnekte **IfcExportAs** parametresiyle ver (ör. `IfcPlate`). Revit eğitiminin 6. günündeki IFC ayarlarıyla birleştir.
2. DirectShape elemanları da kategorilerine göre IFC'ye çıkar; ad ve parametreler korunur.
3. IFC'yi dışa ver ve ücretsiz bir görüntüleyicide aç: panellerin `IfcPlate` olduğunu ve `PanelNo` özelliğinin göründüğünü kontrol et.

## 3. Grasshopper Player (1 saat)

Ekipte Grasshopper bilmeyen biri de tanımlamayı çalıştırabilsin:

1. Tanımlamadaki girdileri sadeleştir: kullanıcının değiştireceği değerler (panel genişliği, cephe mesafesi, aile tipi) en solda, açıkça adlandırılmış parametrelerde olsun.
2. Revit şeridindeki **Grasshopper Player** düğmesi bir `.gh` dosyasını Grasshopper penceresini açmadan çalıştırır. Girdisi olmayan ya da Revit'ten seçim isteyen tanımlamalar bu yolla tek tıkla çalışır (sürüme göre girdi istemleri desteklenir).
3. Örnek: `Panel_Listesi_Al.gh` (6. günün geri okuma + CSV yazma kısmı). Proje yöneticisi Revit'te Player'dan bu dosyayı seçer; güncel panel listesi CSV olarak çıkar.
4. Tanımlamaları ortak bir klasörde, sürüm notuyla tut (`Cephe_Paneller_v03.gh`).

## 4. Son proje (45 dk)

Haftanın tamamını tek tanımlamada birleştir:

- Revit'ten seviyeler ve döşeme kenarları (2. gün)
- Cephe yüzeyi ve 1500 mm panelizasyon
- Panel ailesi yerleştirme ve parametre yazma (5. gün)
- Kat × aks kesişimlerine braket (5. gün)
- Revit'e yazma anahtarı ve "REVIT'E YAZAR" grubu (6. gün)
- Panel listesi CSV'si (6. gün)

Test: Revit'te mimar bir döşemenin kenarını 300 mm değiştirsin. Anahtarı aç: paneller, braketler ve liste tek çözümde güncellenmeli; Element Id'ler (Enabled izleme) korunmalı.

## Gün sonu kontrolü (15 dk)

- [ ] Rhino'dan Revit'e, oradan IFC'ye giden teslim akışını kurabiliyorum.
- [ ] LOD 350 cephe modelinde neyin beklendiğini biliyorum.
- [ ] Cephe elemanlarına doğru Revit kategorisi ve IFC sınıfı verebiliyorum.
- [ ] IFC çıktısında sınıfları ve parametreleri kontrol edebiliyorum.
- [ ] Bir tanımlamayı Grasshopper Player ile tek tıkla çalışır hale getirebiliyorum.
- [ ] Son projeyi kurdum; mimari değişiklikte bütün cephe tek çözümde güncelleniyor.

**Haftadan sonra**

- **Kaynaklar:** Rhino.Inside.Revit resmi kılavuzu ve örnekleri (rhino3d.com/inside/revit), McNeel forumunun Rhino.Inside bölümü (discourse.mcneel.com).
- **Sonraki adım:** RiR içinde Python ve C# bileşenleriyle Revit API'sine doğrudan erişim; sık kullanılan işler için kendi kullanıcı nesnelerin (user objects).
- **Bu sitede:** [Grasshopper](../grasshopper/), [Revit](../revit/) ve [Dynamo](../dynamo/) eğitimleri bu kursun iki ucunu anlatır; [Python](../python/) eğitimi RiR'den çıkan listeleri işler.
