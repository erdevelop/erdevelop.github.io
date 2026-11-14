## Hedef ve Rhino mantığı

Gün sonunda bir cephe modülünün 2B görünüşünü ve bir alüminyum profil kesitini ölçüsünde, katmanlara ayrılmış olarak çizmiş olacaksın. Süre yaklaşık 5 saat. Dosyayı `Gun1_Cephe.3dm` adıyla kaydet.

AutoCAD ya da SolidWorks'ten gelenler için en önemli farklar:

| Konu | Rhino'da |
| --- | --- |
| Komutlar | Komut satırına adını yaz (Polyline, Offset). Enter ya da boşluk tuşu son komutu tekrarlar |
| Geometri | Her şey NURBS: eğriler ve yüzeyler matematiksel olarak tam |
| Geçmiş | SolidWorks gibi bir yapım ağacı yok; parametrik iş için Grasshopper kullanılır (5. gün) |
| Görünüş | 4 pencere: Top, Front, Right, Perspective. Pencere adına çift tıklayınca büyür |
| Seçenekler | Komut satırında altı çizili seçenekler çıkar; harfine basarak ya da tıklayarak seçilir |

## 1. Hazırlık (45 dk)

1. Rhino'yu aç, şablon olarak **Large Objects - Millimeters** seç.
2. **Options > Units**: Model units **Millimeters**, Absolute tolerance **0,01**. Toleransı sonradan değiştirmek mevcut geometriyi düzeltmez; projeye başlarken ayarla.
3. Ekranı tanı:
    - **Komut satırı** (üst): komut adı ve seçenekleri.
    - **Osnap** çubuğu (alt): End, Mid, Cen, Int, Perp, Near.
    - **Durum çubuğu** (en alt): Grid Snap, Ortho, Planar, Osnap, SmartTrack, Gumball, Record History.
    - **Panels** (sağ): Properties, Layers, Help.
4. İlk gün ezberlenecek komut ve tuşlar:

| Komut / tuş | İşlev |
| --- | --- |
| Enter / boşluk / sağ tık | Son komutu tekrarla ya da komutu bitir |
| F8 | Ortho aç/kapa |
| Shift (çizerken) | Geçici Ortho |
| Ctrl+Shift+tık | Alt nesne seç (bir yüz, bir kenar) |
| Zoom > Extents (Z, E) | Her şeyi göster |
| SelLast / SelPrev | Son oluşturulanı / önceki seçimi seç |
| What | Seçili nesnenin türünü ve bilgisini göster |

## 2. Hassas çizim ve koordinat girişi (1 saat)

Rhino'da ölçüyü elle girmek AutoCAD'e benzer ama birkaç farkı var.

| Ne yazarsın | Anlamı |
| --- | --- |
| `0,0` | Mutlak koordinat |
| `r1500,0` | Son noktaya göre göreli koordinat |
| `1500` sonra fareyle yön | Mesafe kısıtı: uzunluk sabit, yön fareden |
| `<90` | Açı kısıtı |
| `1500<90` | Polar: 1500 mm, 90° yönünde |

@fig:koordinat

**Alıştırma: modül görünüşü**

1. **Layers** panelinde katmanlar oluştur: `Aks`, `Modul`, `Profil`, `Cam`, `Olcu`. Her birine farklı renk ver. Çizmeden önce ilgili katmanı aktif yap.
2. `Aks` katmanında **Line** ile 0,0'dan r0,3500 dikey aks çiz. **ArrayLinear** ile 1500 mm aralıkla 4 adet yap.
3. `Modul` katmanında **Rectangle** ile 0,0'dan 1500,3500 modül sınırını çiz.
4. **Offset** ile modül sınırını 60 mm içeri al: profil iç hattı.
5. Spandrel hattı: **Line** ile 0,1100'den r1500,0. **Trim** ile iç hattın dışında kalan kısmı kırp.
6. **Polyline**, **Fillet** (yarıçap 0 ile köşe birleştirme) ve **Join** ile çizgileri temiz, kapalı eğrilere dönüştür.

## 3. Eğri araçları (1 saat)

| Komut | Ne yapar |
| --- | --- |
| Polyline | Düz parçalardan tek eğri |
| InterpCrv | Tıkladığın noktalardan geçen eğri |
| Curve | Kontrol noktalarıyla eğri (noktalardan geçmez) |
| Arc / Circle | Yay ve daire, birçok seçenekle |
| Offset | Paralel eğri |
| Trim / Split | Kırp / böl |
| Join / Explode | Birleştir / parçala |
| Fillet / Chamfer | Köşe yuvarlat / pah |
| CurveBoolean | Kesişen eğrilerden tıklanan bölgenin kapalı sınırını üret |
| Rebuild | Eğrinin kontrol noktası sayısını sadeleştir |

@fig:egri_tipleri

**Kontrol**

1. Bir eğriyi seç ve **What** ile kapalı (closed) olup olmadığına bak. Kapalı olmayan eğri, 2. ve 3. günde yüzey ve katı üretmez.
2. **PointsOn** (F10) ile bir eğrinin kontrol noktalarını aç, birini sürükle, **PointsOff** (F11) ile kapat. Bu, Rhino'da eğri düzenlemenin temel yolu.
3. **CurvatureGraph** ile InterpCrv ve Curve eğrilerinin eğrilik grafiğini karşılaştır.

## 4. DWG kesitini içe al ve temizle (1 saat)

1. **Import** ile bir profil kesiti DWG'si al. Birim sorulursa milimetre.
2. Gelen katmanları kontrol et. Ölçü, tarama ve yazıları ayrı katmana taşı ya da sil.
3. Kesit konturunu seç, **Join**. Komut satırı kaç eğrinin tek eğri olduğunu yazar. Hedef: tek, kapalı eğri.
4. Kapanmıyorsa eğriyi seçip **PointsOn** ile uç noktalarını göster ve açık uçlara yakınlaş. Küçük boşlukları **Extend** ya da **Match** ile kapat, üst üste binen çizgileri **SelDup** ile seçip sil, sonra tekrar **Join**.
5. **Area** ile kesit alanını ölç. Profil kataloğundaki alanla karşılaştır: büyük fark, ölçek ya da açık kontur hatasıdır.
6. Kesiti **Profil** katmanına taşı.

## 5. Ölçülendirme ve kayıt (45 dk)

1. `Olcu` katmanını aktif yap. **Dim**, **DimAligned**, **DimRadius** ile modül genişliği, yüksekliği ve spandrel kotunu ölçülendir.
2. **Annotation styles** (Options > Annotation Styles) içinden metin yüksekliğini ve ok tipini ayarla.
3. **SelLayer** ile bir katmanın tüm nesnelerini seç, **Hide** ve **Show** dene. Katman panelindeki ampul ve kilit simgelerini kullan.
4. Kaydet: `Gun1_Cephe.3dm`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Birim ve toleransı projeye başlarken ayarlamanın neden önemli olduğunu biliyorum.
- [ ] Mutlak, göreli ve polar koordinat girişiyle ölçüsünde çizebiliyorum.
- [ ] Osnap, Ortho ve SmartTrack kullanabiliyorum.
- [ ] Offset, Trim, Join ve CurveBoolean ile temiz kapalı eğri üretebiliyorum.
- [ ] Bir eğrinin kapalı olup olmadığını What ile kontrol edebiliyorum.
- [ ] DWG kesitini içe alıp tek kapalı eğriye dönüştürebiliyorum.
- [ ] Katmanlarla çalışıp ölçülendirme yapabiliyorum.

**Bonus:** **Record History**'yi aç ve bir eğriden **Offset** yap. Asıl eğriyi düzenleyince offset eğrisinin de güncellendiğini gör. Rhino'nun sınırlı geçmiş özelliği bu; tam parametrik iş için Grasshopper var.
