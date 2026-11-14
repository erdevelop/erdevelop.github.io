## Hedef

Gün sonunda Revit modelindeki curtain panelleri Dynamo ile okuyup ölçülerini ve parametrelerini Excel'e aktarmış, Excel'de düzenlediğin değerleri modele geri yazmış olacaksın. Süre yaklaşık 5 saat. Dosya: `Gun3_Excel.dyn`.

Bu, cephe işinde Dynamo'nun en hızlı geri dönüş veren kullanımıdır: yüzlerce paneli tek tek tıklamak yerine bir tabloda düzenlemek.

## 1. Revit elemanlarını seçmek (1 saat)

| Yöntem | Düğüm | Ne zaman |
| --- | --- | --- |
| Tek eleman | Select Model Element | Deneme, tek panel üzerinde test |
| Birden çok eleman | Select Model Elements | Ekranda bir grup |
| Kategori | Categories + All Elements of Category | Projedeki tüm curtain paneller |
| Tip | Family Types + All Elements of Family Type | Belirli bir panel tipinin hepsi |
| Görünüşteki | All Elements In Active View (paketlerle) | Sadece aktif görünüşteki elemanlar |

1. Revit eğitiminin 1-4. günlerinde yaptığın cepheyi aç (curtain wall ve paneller).
2. **Categories**: Curtain Panels. **All Elements of Category**: tüm paneller.
3. **List.Count** ile panel sayısını oku. Revit'teki panel tablosu (schedule) ile karşılaştır.
4. Bir paneli **Select Model Element** ile seç, Watch'ta Revit eleman kimliğini (Element ID) gör.

## 2. Parametre okumak (1 saat)

1. **Element.GetParameterValueByName**: element = paneller, parameterName = `"Width"`. Tüm panellerin genişlikleri gelir.
2. Aynısını `"Height"`, `"Area"`, `"Panel_ID"`, `"Cam_Kodu"` için yap. Parametre adı Revit'te göründüğü gibi, büyük-küçük harf dahil yazılmalı.
3. Parametre bulunamazsa düğüm uyarı verir ve `null` döner. Watch'ta hangi elemanların boş geldiğini gör.
4. **Element.Parameters** ile bir elemanın tüm parametre adlarını listele; doğru adı buradan kopyala.
5. Birimler: Revit iç birimi feet olsa da Dynamo, proje birimlerine göre değer döndürür. Watch'ta mm geldiğini kontrol et.

## 3. Excel'e yazmak (1 saat)

@fig:excel

1. Her panel için bir satır kur: Element ID, Panel_ID, Width, Height, Area, Cam_Kodu.
2. Code Block ile listeleri birleştir: `[id, pid, w, h, a, ck];` sonra **List.Transpose** ile satır satır yap.
3. Başlık satırını ekle: **List.AddItemToFront** ile `["ElementId", "Panel_ID", "Genislik", "Yukseklik", "Alan", "Cam_Kodu"]`.
4. **Data.OpenXMLExportExcel** (Excel kurulu olmasa da çalışır) ya da **Data.ExportExcel**: dosya yolu, sayfa adı `Paneller`, başlangıç satır ve sütunu 0, veri.
5. **Run**. Excel dosyasını aç ve kontrol et.

## 4. Excel'den geri yazmak (1,5 saat)

Hedef: Excel'de Cam_Kodu sütununu düzenleyip modeldeki panellere geri yazmak.

1. Excel'de birkaç panelin Cam_Kodu'nu değiştir (G01 → G02), kaydet ve kapat.
2. Dynamo'da **Data.OpenXMLImportExcel**: aynı dosya, aynı sayfa. Watch'ta satırların geldiğini gör.
3. Başlık satırını **List.RestOfItems** ile at. **List.Transpose** ile sütunlara çevir.
4. Modeldeki panelleri yeniden al (All Elements of Category) ve **Element.Id** ile ID'lerini listele. Excel'deki ID sütununu **String.ToNumber** ile sayıya çevir (metin olarak gelebilir).
5. Excel'deki her satırın modeldeki karşılığını bul: **List.IndexOf** (liste = model ID'leri, öğe = Excel ID'leri), sonra **List.GetItemAtIndex** ile panelleri Excel sırasına diz.
6. **Element.SetParameterByName**: element = bu sıradaki paneller, parameterName = `"Cam_Kodu"`, value = Excel'deki Cam_Kodu sütunu.
7. Run modu **Manual**. **Run**. Revit'te bir paneli seçip Cam_Kodu'nun değiştiğini kontrol et.

**Dikkat**

- Geri yazma işlemi geri alınabilir (Revit'te Ctrl+Z), ama yüzlerce elemanı değiştiren bir grafiği çalıştırmadan önce dosyayı kaydet.
- Satır sırasına güvenme; her zaman Element ID ile eşleştir. Excel'de sıralama yapılırsa sıra bozulur, ID bozulmaz.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Kategori ve tip ile Revit elemanlarını toplu seçebiliyorum.
- [ ] Parametre değerlerini adıyla okuyabiliyor, boş gelenleri bulabiliyorum.
- [ ] Panel listesini başlıklı bir Excel sayfasına yazabiliyorum.
- [ ] Excel'den değerleri okuyup Element ID ile eşleştirerek modele geri yazabiliyorum.
- [ ] Revit'e yazan grafiklerde neden Manual mod kullandığımı biliyorum.

**Bonus:** Excel'e yazarken bir de **Özet** sayfası oluştur: Cam_Kodu'na göre gruplanmış adet ve toplam alan. **List.GroupByKey** ile grupla, **Math.Sum** ile topla.
