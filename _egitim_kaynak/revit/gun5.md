## Hedef ve tanımın akışı

Gün sonunda Revit içinden açılan tek bir Grasshopper tanımın olacak. Bu tanım Rhino yüzeyini bölecek, her panele adaptive aile yerleştirecek, panel numarası ve cam kodunu yazacak, istersen kalınlıklı paneli DirectShape olarak gönderecek. Yüzey değişince Revit modeli de güncellenecek. Süre yaklaşık 5 saat.

Başlamadan önce: `Gun2_Cephe.rvt`'yi `Gun5_RiR.rvt` olarak kaydet. 4. günün `Panel_Adaptive_4N` ailesi ve shared parametreler (Panel_ID, Cam_Kodu) projede yüklü olmalı.

Tanımın akışı:

1. Rhino yüzeyi (GH'de Surface parametresine referans)
2. Yüzeyi U ve V yönünde böl, her alt yüzeyin 4 köşesini sıralı çıkar
3. Her panel için tek dal: 4 nokta, numara ve düzlemsellik sapması
4. İki çıkış:
    - **Adaptive:** Add Component (Adaptive) ve parametre yazma
    - **DirectShape:** Kalınlık verilmiş Brep ve Add DirectShape (Geometry)

@fig:gh_akis

Rhino.Inside.Revit bileşen adları aşağıda [resmi bileşen listesindeki](https://rhino3d.com/inside/revit/1.0/reference/gh-components) gibi yazıldı. Sürümünde küçük farklılıklar olabilir. Bileşenler Grasshopper'daki **Revit** sekmesinde.

## 1. Yüzeyi böl ve sıralı 4 nokta üret (1 saat)

Bu bölüm saf Grasshopper, Revit'e henüz dokunmuyoruz. Tek kritik nokta, her panelin 4 noktasının adaptive ailedeki 1-2-3-4 sırasıyla aynı sırada gelmesi.

1. Revit'te **Rhinoceros** sekmesinden Rhino'yu aç. 2. günün eğrisel yüzeyini Rhino'ya Import et (birim mm).
2. Aynı sekmeden Grasshopper'ı aç. Bir **Surface** parametresi koy, sağ tık > Set one Surface ile yüzeyi seç.
3. İki slider: `U_Adet` = 8, `V_Adet` = 2. 12 m genişlikte 1500 mm, 8 m yükseklikte 4000 mm panel verir.
4. **Divide Domain²** (U, V slider'lara) ve **Isotrim** (SubSrf) ile yüzeyi 16 alt yüzeye böl.
5. **Evaluate Surface** koy. S girişine Isotrim çıkışını bağla, S girişine sağ tıkla: **Graft** ve **Reparameterize** açık.
6. uv girişine sırayla 4 nokta ver: {0,0,0}, {1,0,0}, {1,1,0}, {0,1,0}. Bir Panel bileşenine bu 4 satırı yazıp bağlamak yeterli.
7. Evaluate Surface'in **P** çıkışı artık 16 dallı bir ağaç, her dalda 4 nokta. **Param Viewer** ile kontrol et.
8. **Point List** bileşeniyle noktaları numaralandır. Her panelde 0 sol alt, 1 sağ alt, 2 sağ üst, 3 sol üst olmalı.

@fig:uv_sira

Sıra ters çıkarsa (ör. 0 sağ altta) yüzeyin U yönü ters demektir. Rhino'da **Dir** komutuyla yüzeyin U yönünü çevir ya da uv listesinin sırasını değiştir. Bu adımı doğru kurmadan Revit'e geçme; ters sıralı panel Revit'te ters yüzlü ya da çapraz kırıklı yerleşir.

## 2. Panelleri Revit'e yerleştir (1 saat)

1. Slider'ları geçici olarak `U_Adet` = 2, `V_Adet` = 1 yap. İlk denemeyi 2 panelle yapmak, hatalı bir tanımın Revit'e yüzlerce eleman basmasını önler.
2. **Element Type Picker** koy ve listeden `Panel_Adaptive_4N` tipini seç. Liste uzunsa önce **Built-In Categories** ile Generic Models'ı seçip picker'a bağla.
3. **Add Component (Adaptive)** koy:
    - Points: Evaluate Surface'in P çıkışı (dallı ağaç)
    - Type: Element Type Picker
4. Bileşen çalışır çalışmaz Revit'te 2 panel oluşur. 3D görünüşte kontrol et.
5. Panel ters ya da çapraz kırık görünüyorsa 1. bölümün sonundaki sıra kontrolüne dön.
6. Doğruysa slider'ları 8 ve 2'ye geri al. Revit'teki 2 panel silinip 16 panel gelir.

**Tracking: neden kopya oluşmuyor?**

Rhino.Inside'ın Add bileşenleri kendi oluşturduğu elemanları hatırlar. Tanım tekrar çalışınca eskileri silip yenilerini koyar, dosya kaydedilip açıldıktan sonra bile. Bu yüzden:

- Aynı Add bileşenini kopyalayıp ikinci kez kullanma. Kopya bileşen kendi eleman setini oluşturur ve paneller çift olur.
- GH dosyasını `Gun5_RiR.gh` adıyla RVT'nin yanına kaydet. İlişki bu dosya üzerinden sürer.
- Revit'te bir paneli elle taşırsan, tanım bir sonraki çalışmada onu tekrar GH'deki konumuna çeker. Panelin sahibi artık Grasshopper.

## 3. Panel_ID ve Cam_Kodu yaz (1 saat)

Grasshopper'da hesaplanan bilgi Revit'te parametre olur. Metraj tablosu da ondan beslenir. Bu, Rhino'da yaptığın işin BIM verisine dönüştüğü yer.

**Panel_ID**

1. Add Component (Adaptive)'in **Component** çıkışını **Flatten** et.
2. **List Length** ile panel sayısını al. **Series** (Start 1, Step 1, Count = List Length) ile 1'den 16'ya numara üret.
3. **Format** bileşeni: format metni `P-{0:000}`, giriş Series. Çıktı: P-001, P-002...
4. **Element Parameter** koy:
    - Element: flatten edilmiş panel listesi
    - Parameter: Panel metni `Panel_ID`
    - Value: Format çıktısı

**Cam_Kodu: düzlemsellik kuralı**

Eğrisel cephede bazı paneller düzlükten sapar (warp). Sapma küçükse düz cam, büyükse soğuk büküm ya da özel çözüm gerekir. Bunu otomatik kodlayacağız.

1. Evaluate Surface'in P ağacından **List Item** ile 0, 1, 2 indeksli noktaları al, **Plane 3Pt** ile her panel için düzlem kur.
2. 3 indeksli noktayı al, **Plane Closest Point** ile bu düzleme olan mesafeyi bul (D çıkışı).
3. Slider: `Warp_Tol` = 3 (mm).
4. **Expression** bileşeni, değişkenler x = D, y = Warp_Tol, ifade: `If(x < y, "G01", "G02")`.
5. Çıktıyı Flatten et ve ikinci bir **Element Parameter** ile `Cam_Kodu`'ya yaz.

Yüzeyin eğriliği azsa tüm paneller G01 çıkabilir. Kuralın çalıştığını görmek için Warp_Tol'u 0,5 mm'ye düşür.

**Revit'te kontrol**

1. Adaptive paneller Generic Models kategorisinde olduğu için ikinci günün Panel Listesi'nde görünmez. Generic Models için yeni bir tablo aç: `Adaptive Panel Listesi`, alanlar Family and Type, Panel_ID, Cam_Kodu. Panel_ID ve Cam_Kodu dolu gelmeli.
2. Tabloyu Cam_Kodu'na göre grupla, adetleri gör.
3. Rhino'da yüzeyi biraz bük. Paneller, kodlar ve tablo birlikte güncellenir.

## 4. Kalınlıklı panel: DirectShape (1 saat)

DirectShape, Grasshopper'daki herhangi bir Brep'i Revit'e aile olmadan, doğrudan eleman olarak gönderir. Revit'te düzenlenemez ama kategorisi, parametreleri ve metrajı vardır. LOD 350'de karmaşık cephe geometrisi için en pratik yol bu.

**Kalınlık ver**

1. Isotrim çıkışını Flatten et. **Evaluate Surface** ile her alt yüzeyin ortasındaki normali al: uv = {0.5, 0.5, 0}, S girişinde Reparameterize açık.
2. Slider `Cam_Kalinlik` = 30. **Amplitude** ile normal vektörü bu boya getir.
3. **Extrude**: Base = alt yüzey, Direction = vektör. Sonuç kapalı bir Brep olmalı.
4. Paneller binanın içine doğru kalınlaşıyorsa vektörü **Reverse** ile ters çevir.

**Revit'e gönder**

1. **Add DirectShape (Geometry)** koy:
    - Geometry: Extrude çıktısı
    - Category: **Built-In Categories** ile Generic Models
    - Name: `Panel_Kalin`
2. Üçüncü bölümdeki Format çıktısını yeni bir Element Parameter ile DirectShape'lerin Panel_ID'sine de yaz.
3. Revit'te bir DirectShape seç ve Properties'e bak: kategori, Panel_ID ve hacim bilgisi görünür.

**Hangisi ne zaman**

| | Adaptive aile | DirectShape |
| --- | --- | --- |
| Revit'te düzenlenebilir | Evet, tip ve parametrelerle | Hayır |
| Geometri serbestliği | Ailedeki form kadar | GH'de ne çizersen |
| Tip değiştirme | Bir tipi değiştir, hepsi değişsin | GH'den yeniden üret |
| Dosya boyutu | Küçük | Panel sayısı arttıkça büyür |
| Uygun iş | Tekrar eden, standart paneller | Benzersiz, karmaşık geometri |

Karşılaştırdıktan sonra kullanmayacağın çıkışın Add bileşenine sağ tıkla ve **Disable** et. Onun daha önce oluşturduğu elemanları Revit'te elle sil.

## 5. Güncelleme döngüsü ve kontrol (1 saat)

**Güncelleme testi**

1. Rhino'da yüzeyin bir kontrol noktasını taşı. Revit'teki paneller, kodlar ve tablolar kendiliğinden güncellenmeli.
2. U_Adet'i 8'den 10'a çıkar. Panel sayısı ve Panel_ID numaraları da güncellenir.
3. Revit'te Ctrl+Z dene ve Grasshopper'ın bir çalışmasının Revit'te kaç geri al adımı tuttuğunu gözle. Büyük değişikliklerden önce dosyayı kaydetmek daha güvenli.

**Performans kuralları**

- Tanımı düzenlerken Grasshopper'da **Solver > Disable Solver** aç. Yoksa her kablo değişikliğinde Revit'e yeniden eleman basılır.
- Her yeni tanımı önce 2-4 panelle dene, sonra gerçek sayıya çık.
- Yüzlerce paneli tek tanımda tutma. Cepheyi bloklara ya da kotlara böl, her blok için ayrı Add bileşeni kullan.
- Çalışmayı bitirince GH dosyasını kaydet. Bir sonraki açılışta önce Revit dosyasını, sonra GH dosyasını aç.

## Gün sonu kontrolü

- [ ] Her panelin 4 noktasını adaptive sırayla üretip Param Viewer'da doğrulayabiliyorum.
- [ ] Add Component (Adaptive) ile panelleri Revit'e yerleştirebiliyorum.
- [ ] Tracking'in ne yaptığını ve neden Add bileşenini kopyalamamam gerektiğini biliyorum.
- [ ] Element Parameter ile shared parametre yazabiliyorum.
- [ ] Düzlemsellik sapmasına göre otomatik cam kodu üretebiliyorum.
- [ ] Kalınlıklı paneli DirectShape olarak gönderebiliyorum.
- [ ] Rhino'daki bir değişikliğin Revit tablosuna kadar güncellendiğini gördüm.

**Bonus:** Panel_ID sırasını soldan sağa, alttan üste olacak şekilde yeniden kur. Ya da her panelin alanını GH'de hesaplayıp `Alan_GH` adlı bir parametreye yaz ve Revit'in hesapladığı alanla karşılaştır.
