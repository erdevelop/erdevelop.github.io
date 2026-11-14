## Hedef

Gün sonunda Grasshopper'da panelize ettiğin cepheyi Revit'e **DirectShape** elemanları olarak yazmış olacaksın: doğru kategoride, malzemeli ve her panelin numarası parametresinde. Ayrıca RiR'nin "izleme" (tracking) mantığını öğreneceksin. Süre yaklaşık 5 saat. Dosya: `gun3.gh`.

## 1. Revit'e yazmanın üç yolu (45 dk)

@fig:yollar

| Yol | Ne oluşur | Ne zaman |
| --- | --- | --- |
| DirectShape | Geometri, bir kategoriye atanmış "aptal" Revit elemanı | Koordinasyon, görsel model, karmaşık serbest formlar |
| Yerleşik eleman (native) | Gerçek duvar, döşeme, seviye, aks | Mimari elemanlar; Revit'in kendi davranışı gereken yerler |
| Aile örneği (family instance) | Yüklü bir ailenin, parametreleri doldurulmuş örneği | Paneller, braketler, ankrajlar; metraj ve etiketleme gereken her şey |

Bugün DirectShape, 4. gün yerleşik elemanlar, 5. gün aileler.

## 2. DirectShape ile paneller (2 saat)

1. Grasshopper eğitiminin panelizasyon tanımlamasını aç ya da 2. gündeki cephe yüzeyini **Divide Domain²** + **Isotrim** ile 1500 x kat yüksekliği panellere böl.
2. **Add DirectShape** bileşenini koy (sürüme göre "DirectShape" ya da "Add Geometry DirectShape").
3. Girişler:
   - **Geometry**: panel yüzeyleri (Brep). Kalınlık istiyorsan önce **Extrude** ile 30 mm katı yap.
   - **Category**: **Generic Models** (Genel Modeller). Paneller için Curtain Panels kategorisini de deneyebilirsin; DirectShape her kategoride oluşturulamaz, desteklenmezse bileşen hata verir.
   - **Name**: panel numarası (ör. `P-001`). Liste olarak ver.
4. Bileşen çalışınca Revit modelinde her panel ayrı bir eleman olarak belirir. Revit'te birine tıkla: kategori ve ad görünür.
5. Malzeme: **Material** sorgula ya da RiR'nin malzeme bileşeniyle bir Revit malzemesi seç ve DirectShape'in malzeme girişine ver (sürüme göre geometriye malzeme atayan ayrı bir bileşen gerekebilir).

## 3. İzleme (tracking) mantığı (1 saat)

@fig:izleme

Grasshopper her yeniden hesapladığında Revit'te yeni elemanlar mı oluşur? Hayır: eleman oluşturan RiR bileşenleri **izleme modu** kullanır. Bileşene sağ tıkla:

| Mod | Davranış |
| --- | --- |
| Enabled (varsayılan) | Bileşen önceki çalışmada oluşturduğu elemanları hatırlar ve **onları günceller**. Panel sayısı azalırsa fazlalar silinir |
| Disabled | Her çalışmada yeni eleman oluşturur; öncekiler kalır (dikkat: kopya üretir) |
| Supersede | Öncekileri siler, yenilerini oluşturur (Element Id'ler değişir) |

**Neden önemli:** Revit'te biri bir panele etiket koyduysa ya da bir görünümde gizlediyse, Supersede ile Id değişince bu bilgi kaybolur. Varsayılan **Enabled** modu Id'leri korur.

**Kalıcılaştırmak:** Tasarım bittiğinde elemanları Grasshopper'dan bağımsız yapmak istersen bileşenin izlemesini bırak (sürüme göre "Release Elements" ya da tracking'i kapatmak). Bundan sonra Grasshopper'ı kapatsan da elemanlar modelde kalır ve tanımlama onlara dokunmaz.

## 4. Revit'te kontrol (1 saat)

1. Revit'te bir 3B görünümde panelleri gör. **Görünürlük/Grafik** ile Genel Modeller kategorisini aç/kapat.
2. **Çizelge (Schedule)** oluştur: Genel Modeller, alanlar: Ad (Name), Sayım. Panel listesi çizelgede çıkar.
3. Grasshopper'da panel boyutunu 1500'den 1200'e değiştir: Revit'teki paneller güncellenir, çizelge sayısı değişir.
4. **Geri al:** Grasshopper'ın her çözümü Revit'te tek bir işlem (transaction) olarak kaydedilir; Revit'te **Ctrl+Z** son çözümün değişikliğini geri alır.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] DirectShape, yerleşik eleman ve aile örneği arasındaki farkı biliyorum.
- [ ] Grasshopper geometrisini DirectShape olarak doğru kategoride Revit'e yazabiliyorum.
- [ ] Her elemana ad ve malzeme verebiliyorum.
- [ ] İzleme modlarının (Enabled, Disabled, Supersede) farkını ve Id'lerin önemini biliyorum.
- [ ] Elemanları Grasshopper'dan bağımsız kalıcı hale getirebiliyorum.
- [ ] Revit çizelgesinde DirectShape panellerini sayabiliyorum.

**Bonus:** Panelleri cam ve opak olarak iki gruba ayır (ör. kat kotunun altındaki 800 mm parapet bandı opak), iki ayrı Add DirectShape bileşeniyle farklı malzemelerle yaz. Revit'te çizelgeyi ada göre grupla.
