## Hedef

Son gün modeli dünyaya açıyoruz: diğer programlara doğru formatta aktarmak, modelden metraj tablosu çıkarmak ve sunum görseli hazırlamak. Gün sonunda bir teslim klasörün olacak: STEP, DWG, 3DM, metraj CSV'si ve render görselleri. Süre yaklaşık 5 saat.

## 1. Veri değişimi (1,5 saat)

| Kime | Format | Not |
| --- | --- | --- |
| SolidWorks, CATIA, Inventor | STEP (.stp) | Katılar katı olarak gider; dışa aktarmadan önce naked edge kontrolü yap |
| AutoCAD | DWG / DXF | 2B çizimler için; export şemasıyla sürüm ve çizgi tipini seç |
| Revit | 3DM (Revit'in Import CAD'i ile) ya da Rhino.Inside.Revit | Koordinat ve birimi önceden eşle |
| IFC / BIM | Eklenti gerekir (ör. VisualARQ) ya da Rhino.Inside.Revit üzerinden | Rhino tek başına BIM verisi üretmez |
| 3B baskı, oyun motoru, web | STL, OBJ, FBX, glTF | Mesh'e çevrilir; mesh ayarı kaliteyi belirler |
| Render ve görselleştirme | 3DM ya da FBX | Malzeme ve katmanlar korunur |

@fig:veri_degisim

**Alıştırma**

1. 3. günün braketini **Export Selected**, STEP. Seçeneklerden şema olarak **AP214** ya da **AP242** seç.
2. STEP'i başka bir programda (ya da yeni bir Rhino dosyasında) aç: katı olarak geldi mi, birim mm mi?
3. Cepheyi Revit'e gidecekse koordinatı kontrol et: Rhino'daki 0,0,0 noktası projenin ortak koordinatına denk mi? Değilse, iki programda aynı aks kesişimini referans nokta yapıp modeli oraya taşı.
4. Bir paneli **Export Selected**, STL. Mesh ayarlarında **Detailed controls** ile maksimum sapmayı (ör. 0,1 mm) ayarla. Kaba ayar köşeli, aşırı ince ayar dev dosya üretir.

**İçe alma**

1. SolidWorks'ten gelen bir STEP'i **Import** et. Katmanları ve nesne adlarını kontrol et.
2. Gelen geometride **SelBadObjects** ve **ShowEdges** ile sorunlu yüzeyleri ara.
3. Mesh olarak gelen bir modeli düzenlemek gerekiyorsa Rhino 8'de **QuadRemesh** ve **ToSubD** ile yumuşak, düzenlenebilir bir yüzeye çevirebilirsin.

## 2. Modelden metraj (1,5 saat)

Elle saymak yerine bilgiyi modelden alacağız.

**Rhino ile**

1. **BlockManager**: blok adetleri (braket, bulon).
2. **SelLayer** + komut satırı: katmandaki nesne sayısı (panel adedi).
3. **Area** ve **Length**: seçili yüzeylerin toplam alanı, seçili eğrilerin toplam boyu (profil metrajı).
4. **Volume**: katıların toplam hacmi, yoğunlukla çarpınca ağırlık.

**Grasshopper ile tablo**

1. 5. günün tanımını aç. Her panel için Panel_ID (**Series** + **Format**: `P-{0:000}`), genişlik ve yükseklik (**BoundingBox** ya da kenar uzunlukları), alan ve warp değerini aynı sıralamada hazırla.
2. **Merge** ya da **Concatenate** ile her satırı `P-001;1500;4000;6.00;0.8` biçiminde birleştir. Başlık satırı ekle.
3. Sonucu bir **Panel** bileşenine bağla. Panel'e sağ tıkla, **Stream Contents**, dosya adı `panel_listesi.csv`.
4. CSV'yi Excel'de aç (ayırıcı noktalı virgül). Toplamları Rhino'daki Area sonucuyla karşılaştır.
5. Rhino nesnelerine yazdığın **Attribute User Text** bilgileri de Grasshopper'da okunup aynı tabloya eklenebilir.

## 3. Sunum ve render (1,5 saat)

1. Görüntü modları: **Shaded**, **Rendered**, **Arctic**, **Technical**, **Pen**. Teknik sunum için Technical ve Arctic, gerçekçi görsel için Rendered ya da **Raytraced**.
2. **Materials** panelinden cama yansıtıcı-saydam, alüminyuma metal, betona mat bir malzeme ata. Malzemeyi katmana atamak, nesne nesne atamaktan daha düzenlidir.
3. **Sun** paneli: konum ve tarih-saat gir; gölgeler gerçek güneş açısıyla oluşur. Cephenin hangi saatte gölgede kaldığını görmek için kullanışlı.
4. Bakış açısını **Named Views** ile kaydet: `Sunum_01`, `Sunum_02`.
5. **Render** (Rhino Render) ile görsel al ya da Raytraced modda **ViewCaptureToFile** ile yüksek çözünürlüklü görüntü kaydet (ör. 3000 piksel genişlik).
6. Tasarım seçeneklerini karşılaştırmak için aynı bakış açısından iki görsel al: 5. günün attractor kanatları açık ve kapalı.

## 4. Teslim klasörü (30 dk)

Teslim klasörünü şöyle düzenle:

| Klasör | İçerik |
| --- | --- |
| 01_Model | Temizlenmiş `.3dm` (gereksiz katman ve nesneler silinmiş, **Purge** yapılmış) |
| 02_Grasshopper | `.gh` dosyaları ve kullandığı eklentilerin listesi |
| 03_Disa_Aktarim | STEP, DWG, STL |
| 04_Pafta | PDF ve DWG paftalar |
| 05_Metraj | CSV ve Excel tabloları |
| 06_Gorsel | Render ve ekran görüntüleri |

1. **Purge** ile kullanılmayan katman, blok tanımı, malzeme ve çizgi tiplerini temizle.
2. **Audit3dmFile** ile dosyada hata olup olmadığını kontrol et.
3. Dosya adlarında proje kodu ve revizyon olsun: `P24-CPH-Cephe-A.3dm`.
4. Teslim notu yaz: Rhino sürümü, birim ve tolerans, koordinat referansı, kullanılan eklentiler, bilinen eksikler.

## Gün sonu kontrolü (15 dk)

- [ ] Alıcıya göre doğru dışa aktarma formatını seçebiliyorum.
- [ ] STEP ve STL'yi doğru ayarlarla dışa aktarıp kontrol edebiliyorum.
- [ ] Rhino komutlarıyla adet, alan, uzunluk ve hacim metrajı alabiliyorum.
- [ ] Grasshopper'dan CSV panel listesi çıkarabiliyorum.
- [ ] Malzeme, güneş ve kayıtlı görünüşlerle sunum görseli hazırlayabiliyorum.
- [ ] Purge ve Audit3dmFile ile temiz bir teslim dosyası hazırlayabiliyorum.

**Haftadan sonra**

- **Grasshopper'da derinleşmek:** Data tree, Python bileşenleri ve eklentiler (Pufferfish, LunchBox, Human, Kangaroo) parametrik cephe işinin asıl gücü.
- **Kendi şablonun:** Katman yapısı, annotation stilleri, pafta antetleri ve export şemalarını içeren bir `.3dm` şablon dosyası hazırla.
- **BIM bağlantısı:** Rhino modeli Revit'e taşıyacaksan Rhino.Inside.Revit'i öğren. Bu sitedeki [Revit eğitimi](../revit/) bu konuyla devam ediyor.
- **Katı modelleme ve imalat:** Detaylı parça ve imalat paftası için modeli SolidWorks'e aktar. Bu sitedeki [SolidWorks eğitimi](../solidworks/) bunu anlatıyor.
