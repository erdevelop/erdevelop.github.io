## Hedef

Gün sonunda Rhino/Grasshopper'da ürettiğin panelleri CSV dosyası üzerinden Revit'e aktaran bir grafiğin olacak. Ayrıca Dynamo paketlerini kurmayı ve kullanmayı öğreneceksin. Süre yaklaşık 5 saat. Dosya: `Gun6_Aktarim.dyn`.

Panelleme çoğu zaman Grasshopper'da yapılır. Rhino.Inside.Revit kullanılamıyorsa en sağlam köprü, düz bir metin dosyasıdır: Grasshopper köşe noktalarını yazar, Dynamo okur ve Revit'te paneli kurar.

## 1. Aktarım akışı (30 dk)

@fig:csv_akis

CSV dosyasının biçimi: her satır bir panel.

| Panel_ID | X1 | Y1 | Z1 | X2 | Y2 | Z2 | X3 | Y3 | Z3 | X4 | Y4 | Z4 | Cam_Kodu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-001 | 0 | 0 | 0 | 1500 | 0 | 0 | 1500 | 0 | 4000 | 0 | 0 | 4000 | G01 |

## 2. Grasshopper tarafı (1 saat)

1. Grasshopper eğitiminin 4. günündeki panelleme tanımını aç.
2. Her panelin 4 köşesini adaptive sırasıyla al (uv = 0,0 · 1,0 · 1,1 · 0,1).
3. **Deconstruct Point** ile X, Y, Z'leri ayır; **Concatenate** ya da **Format** ile her panel için bir satır kur, ayırıcı noktalı virgül.
4. Başlık satırını ekle, **Panel** > **Stream Contents** ile `paneller.csv` olarak kaydet.
5. **Koordinat uyumu:** Rhino'daki 0,0,0 ile Revit'in proje taban noktası aynı yerde olmalı. Değilse iki programda aynı aks kesişimini referans alıp Rhino modelini oraya taşı. Birimler iki tarafta da mm olmalı.

## 3. Dynamo tarafı (2 saat)

1. **File Path** düğümüyle CSV'yi seç. **Data.ImportCSV**: satırlar listesi gelir. Ayırıcı noktalı virgül ise **File.ReadText** + **String.Split** ile kendin ayır:

```text
temiz = String.Replace(metin, "\r", "");     // Windows satır sonlarını temizle
satirlar = String.Split(temiz, "\n");
veri = List.RestOfItems(satirlar);           // başlığı at
veri2 = List.FilterByBoolMask(veri, String.Length(veri) > 0)["in"];  // boş satırları at
alan = String.Split(veri2, ";");
sutun = List.Transpose(alan);
```

2. Sayısal sütunları **String.ToNumber** ile sayıya çevir.
3. Her panel için 4 nokta: `Point.ByCoordinates(x1, y1, z1)` … `Point.ByCoordinates(x4, y4, z4)`.
4. `kose = List.Transpose([p1, p2, p3, p4]);` → her panel için 4 noktalı liste.
5. **AdaptiveComponent.ByPoints** ile `Panel_Adaptive_4N` yerleştir.
6. **Element.SetParameterByName** ile CSV'deki Panel_ID ve Cam_Kodu'nu yaz.
7. Önce ilk 2 satırla dene (**List.TakeItems**), sonra hepsini çalıştır.
8. Grasshopper'da panellemeyi değiştir, CSV'yi yeniden yaz, Dynamo'da **Run**: element binding sayesinde paneller güncellenir.

## 4. Paketler (1 saat)

Dynamo'nun çekirdek düğümleri yetmediğinde topluluk paketleri kullanılır.

1. **Packages > Search for a Package** (sürüme göre Package Manager).
2. Sık kullanılan paketler:

| Paket | Ne işe yarar |
| --- | --- |
| Clockwork | Yüzlerce yardımcı düğüm: eleman, parametre, liste işlemleri |
| archi-lab | Revit tabloları, görünüşler, Excel ile ileri işlemler |
| Rhythm | Revit eleman işlemleri, Element.ById benzeri yardımcılar |
| Data-Shapes | Dynamo Player için açılır pencere ve form arayüzleri |

3. Paket kurduğunda grafiği başkasıyla paylaşırken aynı paketin aynı sürümünü onun da kurması gerekir. Grafiğin notuna kullandığın paketleri ve sürümlerini yaz.
4. Kurulan paketin düğümleri Library'de **Add-ons** altında görünür.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Grasshopper'dan panel köşelerini CSV olarak yazabiliyorum.
- [ ] Rhino ile Revit arasındaki koordinat ve birim uyumunu kontrol edebiliyorum.
- [ ] Dynamo'da CSV okuyup metni sayıya çevirebiliyorum.
- [ ] CSV'deki panelleri adaptive aile olarak yerleştirip parametrelerini yazabiliyorum.
- [ ] Paket kurabiliyor ve paylaşımda paket bağımlılığını yönetebiliyorum.

**Bonus:** CSV'ye bir `Tip` sütunu ekle ve Dynamo'da her satır için farklı bir adaptive aile tipi seç: tip adlarını **Family Types** listesinde **List.IndexOf** ile bul.
