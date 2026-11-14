## Hedef

Gün sonunda Grasshopper'daki her panel için Revit'te parametrik bir **aile örneği** yerleştirmiş olacaksın: doğru konumda, doğru yönde ve genişlik, yükseklik, panel no parametreleri dolu. Aynı yöntemle ankraj braketlerini de yerleştireceksin. Süre yaklaşık 5 saat. Dosya: `gun5.gh`.

Bu, cephe koordinasyon modelinin (LOD 300-350) en güçlü yöntemidir: paneller gerçek Revit aileleridir, çizelgede sayılır, etiketlenir ve IFC'de doğru sınıfla çıkar.

## 1. Parametrik panel ailesi (1,5 saat)

Revit'te (Revit eğitiminin 3. gününe benzer) bir aile hazırla:

1. **Yeni > Aile > Metric Generic Model.rft** (yüze bağlı olan "face based" şablonu değil). Kategori: Genel Modeller ya da Perde Duvar Panelleri.
2. Referans düzlemleriyle bir dikdörtgen panel kur: ekleme noktası **sol alt köşe**, panel XZ düzleminde (ön görünüşte), kalınlık Y yönünde.
3. Örnek (instance) parametreleri: `Genislik`, `Yukseklik` (uzunluk), `Kalinlik` (uzunluk, ör. 30), `PanelNo` (metin), `CamKodu` (metin).
4. Ekstrüzyonu bu parametrelere kilitle, malzeme parametresi ekle. Aileyi farklı değerlerle esnet; bozulmuyorsa `Cephe_Panel.rfa` olarak kaydet ve projeye yükle.

@fig:aile

## 2. Panelleri yerleştirmek (2 saat)

1. Grasshopper'da her panelin **sol alt köşesini** ve **yönünü** bul: panel yüzeyini **Deconstruct Brep** ya da **Surface Frames** ile çöz; sol alt köşede, X ekseni panel genişliği yönünde, Y ekseni dışa doğru normal olan bir düzlem (Plane) kur.
2. **Add Component (Location)** bileşeni (sürüme göre "Add Component", "Add Family Instance"): Location girişine düzlemleri, Type girişine `Cephe_Panel` ailesinin tipini, Level girişine seviyeyi ver.
3. Bileşen çalışınca her panel konumunda bir aile örneği oluşur. Yön yanlışsa düzlemin eksenlerini değiştir (**Rotate Plane** ya da X/Y eksenlerini yer değiştir).
4. Paneller şimdilik ailenin varsayılan ölçüsünde. Şimdi parametreleri yazacağız.

## 3. Parametre yazmak (1 saat)

@fig:yaz

1. **Element Parameter** bileşenini yazma için kullan: Element girişine yerleştirilen örnekler, Parameter girişine `Genislik`, Value girişine panel genişlikleri listesi.
2. Aynı şekilde `Yukseklik`, `PanelNo` (`P-001`…), `CamKodu`.
3. Listelerin **sırası** ve **uzunluğu** eşleşmeli: 120 panel, 120 genişlik, 120 numara. Grasshopper'da veri ağacını düzleştir (Flatten) ya da ağaç yapısını eleman listesiyle aynı tut.
4. Revit'te bir panele tıkla: Özellikler'de genişlik, yükseklik ve panel no dolu. Çizelgede `PanelNo` ve `CamKodu`'na göre grupla.

**Birim:** Uzunluk parametrelerine Grasshopper'dan mm (Rhino birimi) gönderirsin; RiR Revit'in iç birimine kendisi çevirir. Metin parametrelerine metin, sayı parametrelerine birimsiz sayı gönder.

## 4. Braketler (30 dk)

Aynı yöntemle ankraj braketleri:

1. Revit'te bir `Cephe_Braket.rfa` genel model ailesi (kutu + plaka yeterli).
2. Grasshopper'da braket noktaları: her dikme hattının her döşeme kotundaki kesişimi (2. gündeki kat hatları × 4. gündeki aks hatları → **Curve | Curve**).
3. Her noktada dışa bakan bir düzlem kur, **Add Component** ile yerleştir, `BraketNo` parametresini yaz (`B-K2-C05` gibi: kat ve aks adından).

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Ekleme noktası ve parametreleri doğru kurulmuş bir panel ailesi hazırladım.
- [ ] Grasshopper'da her panel için konum ve yön düzlemi kurabiliyorum.
- [ ] Aile örneklerini düzlemlere yerleştirebiliyorum.
- [ ] Element Parameter ile uzunluk ve metin parametrelerini yazabiliyorum.
- [ ] Eleman ve değer listelerinin eşleşmesine dikkat ediyorum.
- [ ] Kesişim noktalarına braket ailesi yerleştirip numaralayabiliyorum.

**Bonus:** Panel ailesine bir `Acilir` (evet/hayır) parametresi ve açılır kanat geometrisi ekle (görünürlük parametresine bağlı). Grasshopper'da her katta belirli aks aralıklarındaki panellerde `True` gönder.
